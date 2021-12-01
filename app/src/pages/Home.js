import { useMemo } from "react"

import Markdown from "markdown-to-jsx"
import Debug from "debug"

import { getNotebooks } from "../data/notebooks"
import useFilter from "../hooks/useFilter"

import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import OpenInNewIcon from '@material-ui/icons/OpenInNew'
import RouterLink from "../components/molecules/RouterLink"

const debug = Debug("home");

export default function Home({ ipfs }) {

    const notebooks = useMemo(() => getNotebooks(ipfs), [ipfs]);
    const { notebookList, options, option } = useFilter(notebooks)

    debug("got notebooks", notebooks);
    return  <>
          {/* title */}
        <Box paddingTop={3}>
          <Typography align='center' variant="h1" component="h1" gutterBottom>
          pollinations.ai
          </Typography>

          <div style={{display: 'grid', gridAutoFlow: 'column', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', width: '100%',minHeight: '30vh', paddingTop: '3em'}}>
            <Typography align='center' variant="h6" component="h6" gutterBottom style={{paddingRight: '1em'}}>
            Pollinations is a platform for AI generative media. <br/>  We want to facilitate the translation of multiple human expressions into AI generated art. 
            </Typography>
            <Typography variant="p" component="p" gutterBottom>
            We gather many generative art models in one space. The models you can find here are  all open source and are constantly updated, so you can be sure you will be using the most cutting-edge AI art frameworks.            </Typography>
          </div>


          </Box>

          <div children={ options.length > 0 &&
          <>     
            <Typography 
              className='Lato'
              variant="h2" 
              component="h2" 
              gutterBottom
              align='center'
              children='What do you want to create?'/>
            <div style={{display: 'flex', justifyContent:'center', marginBottom: '8em'}} children={
              options?.map( opt => 
                <Button 
                style={{margin: '0 0.5em'}}
                variant={opt === option.selected ? 'contained' : 'outlined'}
                color={opt === option.selected ? 'secondary' : 'primary'}
                onClick={() => option.setSelected(opt)} 
                children={opt} 
                key={opt}/>)
            }/>
          </>
          } style={GridStyleFilter}/>
          
          <div children={
            notebookList
            .map(notebook => <NotebookCard key={notebook.name} notebook={notebook} />)
          } style={GridStyleNotebooks}/>
  </>;
}
let GridStyleNotebooks = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '1em'
}
let GridStyleFilter = {
  // width: '100%',
  // display: 'flex',
  // justifyContent: 'space-between',
  // flexWrap: 'wrap',
  // gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  //gap: '1em',
  margin: '1.5em 0',
  marginTop: '50px'
}


const NotebookCard = ({notebook}) => {
    const {category, name, path, Icon, description} = notebook;
    return  <Box>
        <Card style={{backgroundColor: 'transparent', border: '0.9px solid rgb(255, 236, 249)', borderRadius: 20}}>
        <CardHeader
        subheader={<Typography className='Lato' variant="h5" component="h5" gutterBottom children={<RouterLink children={name?.slice(2)} to={path}/>}/>} 
        title={<Typography className='Lato' variant="p" component="p" gutterBottom children={<RouterLink to={path} children={category?.slice(2)}/>} />} 
        action={<></>} />
            <CardContent style={{backgroundColor: 'yellow !important'}}>
            
                <Markdown className='markDownGambiarra' style={{pointerEvents: "none"}}>{description}</Markdown>
                {console.log(description)}
            </CardContent>
        </Card>
    </Box>
}