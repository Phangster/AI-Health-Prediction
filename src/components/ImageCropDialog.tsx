"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crop, RotateCcw, Check, X } from "lucide-react";
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onConfirm: (croppedImageBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropDialog({
  isOpen,
  onClose,
  imageUrl,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Set initial crop to center 80% of the image
    setCrop(centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
          height: 80,
        },
        width / height,
        width,
        height,
      ),
      width,
      height,
    ));
  }, []);

  // No fixed aspect ratio - allow any size
  const aspect = undefined;

  const getCroppedImg = useCallback(
    async (
      image: HTMLImageElement,
      crop: PixelCrop,
      rotation = 0,
    ): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio;
      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      // 5) Move the crop origin to the canvas origin (0,0)
      ctx.translate(-cropX, -cropY);
      // 4) Move the origin to the center of the original position
      ctx.translate(centerX, centerY);
      // 3) Rotate around the origin
      ctx.rotate((rotation * Math.PI) / 180);
      // 2) Scale the image
      ctx.scale(1, 1);
      // 1) Move the center of the image to the origin (0,0)
      ctx.translate(-centerX, -centerY);

      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );

      ctx.restore();

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            }
          },
          'image/jpeg',
          0.9,
        );
      });
    },
    [],
  );

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        rotation,
      );
      onConfirm(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Receipt Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={50}
                minHeight={50}
                keepSelection
                ruleOfThirds
              >
                <img
                  ref={imgRef}
                  alt="Receipt to crop"
                  src={imageUrl}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    maxWidth: '100%',
                    maxHeight: '60vh',
                    objectFit: 'contain',
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!completedCrop || isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm & Extract
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 