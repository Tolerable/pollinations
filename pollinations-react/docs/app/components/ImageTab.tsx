import React, { useState } from 'react';
import { usePollinationsImage } from '@pollinations/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'lucide-react';

interface ImageTabProps {
  imageModels: string[];
  selectedImageModel: string;
  setSelectedImageModel: (model: string) => void;
}

const ImageTab: React.FC<ImageTabProps> = ({
  imageModels,
  selectedImageModel,
  setSelectedImageModel,
}) => {
  const [imagePrompt, setImagePrompt] = useState("A futuristic city with flying cars and neon lights");
  const [imageSeed, setImageSeed] = useState<number>(42);
  const [imageWidth, setImageWidth] = useState<number>(1024);
  const [imageHeight, setImageHeight] = useState<number>(1024);

  const imageUrl = usePollinationsImage(imagePrompt, {
    width: imageWidth,
    height: imageHeight,
    seed: imageSeed,
    model: selectedImageModel,
    nologo: true
  });

  const getImageCode = (): string => {
    const imageUrlWithParams = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${imageWidth}&height=${imageHeight}&seed=${imageSeed}&model=${selectedImageModel}&nologo=true`;

    return `
import React from 'react';
import { usePollinationsImage } from '@pollinations/react';

const ImageComponent: React.FC = () => {
  const imageUrl = usePollinationsImage("${imagePrompt}", {
    width: ${imageWidth},
    height: ${imageHeight},
    seed: ${imageSeed},
    model: '${selectedImageModel}',
    nologo: true
  });

  return (
    <div>
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Generated image" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ImageComponent;
    `;
  };

  return (
    <Card className="bg-slate-800 text-slate-100">
      <CardHeader>
        <CardTitle>Image Generation</CardTitle>
        <CardDescription>Generate images using Pollinations' API</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div>
            <Label htmlFor="imagePrompt">Prompt</Label>
            <Input
              id="imagePrompt"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="bg-slate-700 text-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="imageModel">Model</Label>
            <Select
              value={selectedImageModel}
              onValueChange={setSelectedImageModel}
            >
              <SelectTrigger id="imageModel" className="bg-slate-700 text-slate-100">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 text-slate-100">
                {imageModels.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="imageSeed">Seed</Label>
            <Input
              id="imageSeed"
              type="number"
              value={imageSeed}
              onChange={(e) => setImageSeed(Math.max(1, Number(e.target.value)))}
              min={1}
              className="bg-slate-700 text-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="imageWidth">Width</Label>
            <Input
              id="imageWidth"
              type="number"
              value={imageWidth}
              onChange={(e) => setImageWidth(Math.max(32, Number(e.target.value)))}
              min={32}
              className="bg-slate-700 text-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="imageHeight">Height</Label>
            <Input
              id="imageHeight"
              type="number"
              value={imageHeight}
              onChange={(e) => setImageHeight(Math.max(32, Number(e.target.value)))}
              min={32}
              className="bg-slate-700 text-slate-100"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Generated Image:</h3>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Generated image"
                className="w-full h-auto rounded-md"
              />
            ) : (
              <p>Loading...</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Code Preview:</h3>
            <div className="relative">
              <SyntaxHighlighter language="typescript" style={oneDark} className="rounded-md">
                {getImageCode()}
              </SyntaxHighlighter>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(getImageCode())}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageTab;


