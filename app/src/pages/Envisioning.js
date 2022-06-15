import styled from '@emotion/styled';
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Debug from "debug";
import React from "react";
import CustomFormikForm from '../components/form/CustomFormik';
import NotebookTitle from "../components/NotebookTitle";
import useIPFSWrite from '../hooks/useIPFSWrite';

const API_URL = "http://eleph-beecl-1OHF1H6OP0ANU-1012574990.us-east-1.elb.amazonaws.com/pollen/"

const debug = Debug("Envisioning");

export default React.memo(function Create() {

  const inputs = {
    "prompt": {
      type: "string",
      default: "Enter your prompt here",
      title: "Prompt",
      description: "The image you want to be generated",
    },
    "image_width": {
      type: "number",
      default: 1280,
      title: "Image Width",
      description: "The width of the final image",
    },
    "image_height": {
      type: "number",
      default: 720,
      title: "Image Height",
      description: "The height of the final image",
    }
  }

  return <Box my={2}>

      
        <CenterContent>
          <div>

            <NotebookTitle name='Envisioning "API"' />
            <Typography variant="h5" gutterBottom>
              Inputs
            </Typography>

            <CustomFormikForm inputs={inputs} onSubmit={onSubmit}/>
          </div> 
        </CenterContent>

          
    </Box>
});


// Functions

async function onSubmit(values){
    debug (values)

    // in real life submit parameters do IPFS and return the folder hash
    const ipfs_hash = await UploadInputstoIPFS(values);

    // debug payload
    let payload = {
      "notebook": "latent-diffusion",
      "ipfs": "QmVArmzi9u4K3LoUcEwFxUyTibZ4a4BNJ3oq7qtJhTQ5dx",
    };
      
    try {
      const response = await fetch(
          API_URL, { 
          method: "POST",
          mode: 'cors',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );
      debug(response)
      return response
    } catch (error) {
      debug(error)
      return error
    }
  }


async function UploadInputstoIPFS(values){
  const { add, cid, mkDir } = useIPFSWrite()
  debug(values)
  // const newFiles = await Promise.all(values.map(async file => {

  //   await add(file.path, file.stream())

  //   return file.path
  // }));

  // const rootCID = await cid()
}

// STYLES
const CenterContent = styled.div`
display: flex;
justify-content: center;
align-items: center;
width: 100%;
margin-top: 1em;
`;

