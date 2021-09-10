
import { create, globSource } from "ipfs-http-client";
import { toPromise, callLogger, toPromise1, noop, retryException } from "./utils.js";
import { CID } from "multiformats/cid";
import cacheInput, { cacheOutput, cleanCIDs } from "./contentCache.js";
import reachable from "is-port-reachable";
import { AbortController } from 'native-abort-controller';
import all from "it-all";

import Debug from "debug";
import { last } from "ramda";

import limit from "../utils/concurrency.js";
import { join } from "path";

import options from "../backend/options.js";

import { Channel } from 'queueable';
import awaitSleep from "await-sleep";
import { isNode } from "browser-or-node";

export const ipfsGlobSource = globSource;

const debug = Debug("ipfsConnector")


const IPFS_HOST = "https://ipfs.pollinations.ai";

export const mfsRoot = `/tmp_${Math.round(Math.random() * 100000)}/`;


// frequency at which to send heartbeats vis pubsub
const HEARTBEAT_FREQUENCY = 15;


const localIPFSAvailable = async () => {
    if (isNode) {
        return await reachable(5001);
    } else {

        // If a local IPFS node is running it breaks pollinations
        // for some reason. O it's just really slow to connect to
        // the other nodes. A flag on in localStorage needs to be
        // set for now to use a local node
        if (!localStorage.localIPFS)
            return false;

        try {
            // The fllowing line will return 404 if the port is open,
            // otherwise it will throw an exception.
            await fetch("http://localhost:5001", { mode: 'no-cors' })
            return true;
        } catch (e) {
            return false;
        }
    }
}

const getIPFSDaemonURL = async () => {
    if (await localIPFSAvailable()) {
        debug("Ipfs at localhost:5001 is reachable. Connecting...");
        return "http://localhost:5001";
    }
    debug("localhost:5001 is not reachable. Connecting to", IPFS_HOST);
    return IPFS_HOST;
}


const ipfsDaemonURL = getIPFSDaemonURL();

export const client = ipfsDaemonURL.then(url => create({url, timeout: "2h"}));

export const nodeID = client.then(async client => options.nodeid || (await client.id()).id);

(async () => {
    debug("NodeID", await nodeID);
    // window.client = await client;
})();

export async function getCID(ipfsPath = "/") {
    ipfsPath = join(mfsRoot, ipfsPath);
    const cid = stringCID(await client.files.stat(ipfsPath));
    debug("Got CID", cid, "for path", ipfsPath);
    return cid;
}


export const getWebURL = (cid, name = null) => {
    const filename = name ? `?filename=${name}` : '';
    return `https://pollinations.ai/ipfs/${cid}${filename}`
};

export const getIPNSURL = (id) => {
    return `https://pollinations.ai/ipns/${id}`;
};

const stripSlashIPFS = cidString => { debug("stripSlash", cidString); return cidString.replace("/ipfs/", "") };
const firstLine = s => s.split("\n")[0];

export const stringCID = file => firstLine(stripSlashIPFS(file instanceof Object && "cid" in file ? file.cid.toString() : (CID.asCID(file) ? file.toString() : (file instanceof Buffer ? file.toString() : file))));

const _normalizeIPFS = ({ name, path, cid, type }) => ({ name, path, cid: stringCID(cid), type });

export const ipfsLs = async cid => {
    debug("calling ipfs ls with cid", cid);
    const result = (await toPromise((await client).ls(stringCID(cid))))
        .filter(({ type, name }) => type !== "unknown" && name !== undefined)
        .map(lsResult => { debug("lsResult", lsResult); return lsResult })
        .map(_normalizeIPFS);
    debug("got ipfs ls result", result);
    return result;
};



export const ipfsAdd = cacheInput(limit(async (ipfsPath, content, options = {}) => {
    const _client = await client;
    ipfsPath = join(mfsRoot, ipfsPath);
    debug("adding", ipfsPath, "options", options);
    const cid = stringCID(await retryException(
        async () => await _client.add(content, options)
    ));
    debug("added", cid);


    try {
        debug("Trying to delete", ipfsPath);
        await _client.files.rm(ipfsPath, { recursive: true });
    } catch {
        debug("Could not delete. Probably did not exist.")
    };
    debug("copying to", ipfsPath);
    try {
        await _client.files.cp(`/ipfs/${cid}`, ipfsPath, { create: true });
    } catch (e) {
        debug("couldn't copy. file probably existed for some reason");
    }
    return cid;
}));

export const ipfsGet = limit(cleanCIDs((async (cid, { onlyLink = false }) => {

    const _debug = debug.extend(`ipfsGet(${cid})`);


    if (onlyLink)
        return getWebURL(cid);

    const chunks = await all((await client).cat(cid))

    _debug("Got all chunks. Total:", chunks.length);

    const contentArray = Buffer.concat(chunks);

    // const contentArray = Buffer.concat(await toPromise(client.get(cid)));
    _debug("Received content length:", contentArray.length);
    // debug("Content type",contentArray)
    return contentArray;
})));

export const ipfsAddFile = async (ipfsPath, localPath, options = { size: null }) =>
    await retryException(async () => await ipfsAdd(ipfsPath, globSource(localPath, { preserveMtime: true, preserveMode: true })));


export async function ipfsMkdir(path = "/") {
    const _client = await client;
    const withMfsRoot = join(mfsRoot, path);
    debug("Creating folder", withMfsRoot);
    try {
        await _client.files.mkdir(withMfsRoot, { parents: true });
    } catch (e) {
        debug("couldn't create folder because it probably already exists", e)
    }
    return await _client.files.stat(withMfsRoot);
}

export async function ipfsRm(ipfsPath) {
    ipfsPath = join(mfsRoot, ipfsPath);
    debug("Deleting", ipfsPath);
    await (await client).files.rm(ipfsPath, { force: true })
}

export async function contentID(mfsPath = "/") {
    const _client = await client;
    mfsPath = join(mfsRoot, mfsPath);
    return stringCID(await retryException(async () => await _client.files.stat(mfsPath)));
}

let _lastContentID = null;




// create a publisher that sends periodic heartbeats as well as contentid updates
export function publisher(nodeID=null, suffix = "/output") {
    
    debug("Creating publisher for", nodeID, suffix);

    const _publish = async cid => {
        await publish(cid, suffix, nodeID);
    };

    const handle = setInterval(() => {
        publishHeartbeat(suffix, nodeID);
    }, HEARTBEAT_FREQUENCY * 1000);

    const close = () => {
        clearInterval(handle);
    };

    return { publish: _publish, close };
}

async function publishHeartbeat(suffix, _nodeID) {
    if (_nodeID === null) 
        _nodeID = await nodeID;
    if (_nodeID === "ipns") 
        return;
    
    debug("publishing heartbeat to", nodeID+suffix);
    const _client = await client;
    await _client.pubsub.publish(_nodeID + suffix, "HEARTBEAT");
}

export async function publish(rootCID, suffix = "/output", _nodeID = null) {

    if (_nodeID === null) 
        _nodeID = await nodeID;

    if (_lastContentID === rootCID) {
        debug("Skipping publish of rootCID since its the same as before", rootCID)
        return;
    }
    _lastContentID = rootCID;
    
    const _client = await client;
    debug("publish pubsub", await nodeID, rootCID);

    if (_nodeID === "ipns")
        await experimentalIPNSPublish(rootCID, _client);
    else
        await _client.pubsub.publish(_nodeID + suffix, rootCID)
}


let abortPublish = null;

async function experimentalIPNSPublish(rootCID, _client = null) {
    if (!_client)
        _client = await client;
    debug("publishing to ipns...", rootCID);
    if (abortPublish)
        abortPublish.abort();
    abortPublish = new AbortController();
    await _client.name.publish(rootCID, { signal: abortPublish.signal, allowOffline: false })
        .then(() => {
            debug("published...", rootCID);
            abortPublish = null;
        })
        .catch(e => {
            debug("exception on publish.", e);
        });
}

export async function subscribeGenerator(_nodeID = null, suffix = "/input") {
    if (_nodeID === null)
        _nodeID = await nodeID;

    const channel = new Channel();
    const topic = _nodeID + suffix;
   
    debug("Subscribing to pubsub events from", topic);

    const unsubscribe = subscribeCID(topic,
        cid => channel.push(cid)
    );
    return [channel, unsubscribe];
}

export function subscribeCID(_nodeID = null, callback) {
    
    let lastHeartbeatTime = 0;

    return subscribeCallback(_nodeID, message => {
        if (message === "HEARTBEAT") {
            const time = new Date().getTime();
            debug("Heartbeat from Pollinator. Time since last:", (time - lastHeartbeatTime) / 1000);
            lastHeartbeatTime = time;
        } else {
            callback(message);
        }
    });
};

function subscribeCallback(_nodeID = null, callback) {
    const abort = new AbortController();
    // let interval = null;
    (async () => {
        const _client = await client;
        if (_nodeID === null)
            _nodeID = await nodeID;

        const onError = async (...errorArgs) => {
            debug("onError", ...errorArgs, "aborting");
            abort.abort();
            await awaitSleep(300);
            debug("resubscribing")
            await doSub();
        };

        const handler = ({ data }) => {
            const message = new TextDecoder().decode(data)
            callback(message);
        }

        const doSub = async () => {
            try {
                abort.abort();
                debug("Executing subscribe", _nodeID);
                await _client.pubsub.subscribe(_nodeID, (...args) => handler(...args), { onError, signal: abort.signal, timeout: "1h" });
            } catch (e) {
                debug("subscribe error", e, e.name);
                if (e.name === "DOMException") {
                    debug("subscription was aborted. returning");
                    return;
                }

                if (e.message?.startsWith("Already subscribed"))
                    return;
                await awaitSleep(300);
                await doSub();
            }
        };
        doSub();
        // if (interval)
        //     clearInterval(interval);
        // interval = setInterval(doSub, 30000);
    })();

    return () => {
        debug("subscribe abort was called");
        abort.abort();
        // if (interval)
        //     clearInterval(interval);
    };
}


export const ipfsResolve = async path =>
    stringCID(last(await toPromise((await client).name.resolve(path, { nocache: true }))));




