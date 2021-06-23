import React, { useEffect, useMemo, useState } from "react";
import { Paper } from "@material-ui/core"

import Markdown from 'markdown-to-jsx';


import useColab from "../network/useColab"
import readMetadata from "../backend/notebookMetadata";

import Debug from "debug";


// Components
import { IpfsLog } from "../components/Logs";
import FormView from '../components/Form'
import ImageViewer, { getCoverImage } from '../components/MediaViewer'
import NodeStatus from "../components/NodeStatus";
import { SEO, SEOMetadata } from "../components/Helmet";




const debug = Debug("Model");



const getNotebookMetadata = ipfs => readMetadata(ipfs["notebook.ipynb"]);




export default React.memo(function Model() {

  const { state, dispatch: dispatchInputState, setStatus } = useColab(); // {state:{ipfs:{},contentID: null, nodeID:null}, dispatch: noop}

  const { ipfs, nodeID, status, contentID } = state;

  const metadata = getNotebookMetadata(ipfs);

  //debug("images", images)
  useEffect(() => {
    debug("First model render. We have a problem if you see this twice.")
  }, []);


  const dispatchForm = async inputs =>  dispatchInputState({ ...state, inputs: {...inputs, formAction: "submit"} });

  const cancelForm = () => dispatchInputState({...state, inputs: {...state.inputs, formAction: "cancel" }})

  return <div style={{display:'flex', flexWrap: 'wrap'}}>
      <SEO metadata={metadata} output={ipfs.output} />
      {/* control panel */}

        {/* just in case */}
        {metadata && metadata.description ?<div style={{ width: '100%'}}><Markdown>{metadata.description}</Markdown></div> : null}

        {/* status */}
        <div style={{ width: '100%'}}>
          <NodeStatus {...state} />
        </div>
        
        {/* inputs */}
        <div style={{ width: '100%'}}>
          <h3 children='Inputs' />

          <FormView
            input={ipfs.input}
            status={status}
            colabState={ipfs?.output?.status}
            metadata={metadata}
            nodeID={nodeID}
            onSubmit={dispatchForm} 
            onCancel={cancelForm}
            />
        </div>

      {/* previews */}
      { ipfs.output && <div >
                          <ImageViewer output={ipfs.output} contentID={contentID}/>
                        </div>
      }    

      <div style={{ width: '100%'}}>
          <IpfsLog state={state}/>
      </div>


    </div>
});
