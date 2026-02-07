import { useRef, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { AvatarPresets } from './AvatarPresets';
import { getCroppedImg } from './avatarUtils';
import { Camera, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AvatarEditorProps {
  value?: string | null;
  displayName?: string | null;
  onChange: (value: string) => void;
}

export function AvatarEditor({ value, displayName, onChange }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Arquivo muito grande (máx. 5MB)';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Por favor, selecione um arquivo de imagem';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const image = reader.result?.toString();
        if (!image) {
          const errorMsg = 'Falha ao carregar imagem';
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }
        setRawImage(image);
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setError(null);
      } catch (err) {
        const errorMsg = 'Erro ao processar imagem';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('Error loading image:', err);
      }
    });

    reader.addEventListener('error', () => {
      const errorMsg = 'Falha ao ler arquivo';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('FileReader error');
    });

    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleApplyCrop = async () => {
    if (!rawImage || !croppedAreaPixels) {
      setError('Por favor, selecione uma área para recortar');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cropped = await getCroppedImg(rawImage, croppedAreaPixels);
      onChange(cropped);
      setIsCropping(false);
      setRawImage(null);
      toast.success('Avatar atualizado!');
    } catch (err) {
      const errorMsg = 'Erro ao processar avatar';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setRawImage(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Preview + Actions */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden border-2 border-slate-700">
            {value ? (
              <img 
                src={value} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Avatar image failed to load');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Camera className="w-8 h-8 text-slate-500" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing || isCropping}
            className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
          >
            <Camera className="w-4 h-4 mr-2" />
            {value ? 'Trocar foto' : 'Enviar foto'}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onSelectFile}
          disabled={isProcessing || isCropping}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Cropper */}
      {isCropping && rawImage && (
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 p-4 space-y-4">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="round"
              showGrid={false}
              restrictPosition={true}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-xs text-slate-400 whitespace-nowrap">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-cyan-500"
              disabled={isProcessing}
            />
            <span className="text-xs text-slate-400 w-8">{(zoom * 100).toFixed(0)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || !croppedAreaPixels}
              className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
            >
              {isProcessing ? 'Processando...' : 'Aplicar recorte'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelCrop}
              disabled={isProcessing}
              className="text-slate-300 hover:text-white hover:bg-slate-800/60"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400">Ou escolha um modelo de avatar</p>
        <AvatarPresets
          displayName={displayName}
          selected={value ?? null}
          onSelect={(dataUrl) => {
            onChange(dataUrl);
            toast.success('Avatar atualizado!');
          }}
        />
      </div>
    </div>
  );
}
