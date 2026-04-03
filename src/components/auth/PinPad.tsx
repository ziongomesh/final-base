import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Delete, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


interface PinPadProps {
  mode: 'register' | 'verify';
  onSubmit: (pin: string) => Promise<void>;
  loading?: boolean;
}

export function PinPad({ mode, onSubmit, loading = false }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleNumberClick = (num: string) => {
    if (mode === 'register' && step === 'confirm') {
      if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
    } else {
      if (pin.length < 4) setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (mode === 'register' && step === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (mode === 'register') {
      if (step === 'enter' && pin.length === 4) {
        setStep('confirm');
        return;
      }
      if (step === 'confirm' && confirmPin.length === 4) {
        if (pin === confirmPin) {
          await onSubmit(pin);
        } else {
          setConfirmPin('');
          setStep('enter');
          setPin('');
        }
      }
    } else {
      if (pin.length === 4) await onSubmit(pin);
    }
  };

  const currentPin = mode === 'register' && step === 'confirm' ? confirmPin : pin;
  const canSubmit = mode === 'register'
    ? (step === 'enter' ? pin.length === 4 : confirmPin.length === 4)
    : pin.length === 4;

  const title = mode === 'register'
    ? (step === 'enter' ? 'Registrar PIN' : 'Confirmar PIN')
    : 'Digite seu PIN';

  const description = mode === 'register'
    ? (step === 'enter' ? 'Crie um PIN de 4 dígitos para proteger sua conta' : 'Digite o PIN novamente para confirmar')
    : 'Digite seu PIN de 4 dígitos para acessar';

  return (
    <div className="w-full">
      <div className="w-full max-w-sm mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center">
            <Logo className="h-14 w-14" />
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-200",
                currentPin.length > index
                  ? "border-primary bg-primary/15"
                  : "border-gray-700 bg-gray-900/50"
              )}
            >
              {currentPin.length > index && (
                <div className="w-3 h-3 rounded-full bg-primary animate-in zoom-in duration-150" />
              )}
            </div>
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="h-14 text-xl font-semibold bg-gray-900/60 border-gray-700 text-white hover:bg-primary/20 hover:border-primary transition-all backdrop-blur-sm"
              onClick={() => handleNumberClick(num)}
              disabled={loading}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-14 bg-gray-900/60 border-gray-700 text-gray-400 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400 transition-all backdrop-blur-sm"
            onClick={handleDelete}
            disabled={loading || currentPin.length === 0}
          >
            <Delete className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="h-14 text-xl font-semibold bg-gray-900/60 border-gray-700 text-white hover:bg-primary/20 hover:border-primary transition-all backdrop-blur-sm"
            onClick={() => handleNumberClick('0')}
            disabled={loading}
          >
            0
          </Button>
          <Button
            className="h-14 bg-primary hover:bg-primary/80 transition-all"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </Button>
        </div>

        {mode === 'register' && step === 'confirm' && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-gray-500 hover:text-white"
            onClick={() => {
              setStep('enter');
              setConfirmPin('');
              setPin('');
            }}
          >
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
