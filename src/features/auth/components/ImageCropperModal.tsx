import { useState, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, Crop, RotateCw } from 'lucide-react';

interface Props {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ image, onCropComplete, onClose }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central point to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(data, 0, 0);

    // As Base64 string
    return canvas.toDataURL('image/jpeg');
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleCrop = async () => {
    if (croppedAreaPixels) {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2E2E2E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic">قص الصورة</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-gray-950 min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteInternal}
            classes={{ containerClassName: 'cropper-container' }}
          />
        </div>

        {/* Controls */}
        <div className="p-6 bg-white dark:bg-[#1E1E1E] border-t border-gray-100 dark:border-[#2E2E2E]">
          <div className="space-y-6">
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-arabic text-gray-400">التكبير</span>
                <span className="text-xs font-mono text-gray-500">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-100 dark:bg-[#252525] rounded-lg appearance-none cursor-pointer accent-primary-400"
              />
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 rounded-xl text-sm font-arabic hover:bg-gray-200 dark:hover:bg-[#2E2E2E] transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                تدوير
              </button>
              
              <button 
                onClick={handleCrop}
                className="flex-1 py-3.5 bg-primary-400 text-white font-bold rounded-2xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 font-arabic"
              >
                <Crop className="w-5 h-5" />
                قص ورفع الصورة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
