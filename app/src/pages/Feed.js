import { useEffect, useState } from "react"
import useIPFS from "../hooks/useIPFS"
import { subscribeCID } from "../network/ipfsPubSub"
import ResultViewer from "./ResultViewer"
import Typography from "@material-ui/core/Typography"

const Feed = () => {
    const [cid, setCid] = useState(null)

    const ipfs = useIPFS(cid)

    useEffect(() => subscribeCID("processing_pollen", "", setCid),[])
    
    return <>
        <Typography variant="h3" component="h3" gutterBottom>
          🌸 Pollinations Feed
        </Typography>
        <ResultViewer ipfs={ipfs} />
    </>
}

export default Feed