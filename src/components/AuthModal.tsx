import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X } from 'lucide-react';
import { loginWithGoogle, saveUserRegistration, isFirebaseConfigured } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  if (!isFirebaseConfigured) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <LogIn size={24} />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Configuración necesaria</h2>
              <p className="text-zinc-500 mb-6 text-sm">
                Has conectado tu proyecto de Firebase. Para terminar, sigue estos 3 pasos:
              </p>
              
              <div className="space-y-4 mb-8 text-left">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-zinc-600 font-medium">Ve a <a href="https://console.firebase.google.com" target="_blank" className="font-bold underline text-blue-600">Firebase Console</a> e ingresa a tu proyecto <strong>bizmind-ai</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-zinc-600">Crea una <strong>Web App</strong> (icono <code className="bg-zinc-100 px-1 rounded">{`</>`}</code>) y copia los valores del objeto <code className="bg-zinc-100 px-1 rounded">firebaseConfig</code>.</p>
                </div>
                <div className="flex gap-3 text-left">
                  <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">3</div>
                  <div className="text-sm text-zinc-600">
                    En esta ventana, ve arriba a <strong>Settings {'>'} Secrets</strong> y pega los valores con estos nombres (¡exactamente así!):
                    <div className="mt-3 grid grid-cols-1 gap-1.5 text-[10px] font-mono bg-zinc-900 text-zinc-300 p-3 rounded-lg border border-zinc-800 shadow-inner">
                      <div>VITE_FIREBASE_API_KEY</div>
                      <div>VITE_FIREBASE_AUTH_DOMAIN</div>
                      <div>VITE_FIREBASE_PROJECT_ID</div>
                      <div>VITE_FIREBASE_STORAGE_BUCKET</div>
                      <div>VITE_FIREBASE_MESSAGING_SENDER_ID</div>
                      <div>VITE_FIREBASE_APP_ID</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
              >
                Entendido, voy a Secrets
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const result = await loginWithGoogle();
      await saveUserRegistration(result.user);
      onClose();
    } catch (err: any) {
      console.error("Login failed", err);
      const errorCode = err.code || 'unknown';
      let message = "Error al iniciar sesión con Google.";
      
      if (errorCode === 'auth/operation-not-allowed') {
        message = "El inicio de sesión con Google NO está activado en tu Firebase Console. Ve a Authentication > Sign-in method y actívalo.";
      } else if (errorCode === 'auth/unauthorized-domain') {
        message = "Este dominio no está autorizado. Añade tanto el dominio de desarrollo como el de producción en Authentication > Settings > Authorized domains.";
      } else if (errorCode === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.";
      }
      
      setError(`${message} (Código: ${errorCode})`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <LogIn size={24} />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Continuar con BizMind-AI</h2>
              <p className="text-zinc-500 mb-8">Has alcanzado el límite de consultas gratuitas. Regístrate para continuar aprovechando todo nuestro potencial.</p>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg animate-pulse">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all font-bold text-zinc-700 shadow-sm active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  Continuar con Google
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-zinc-400 leading-relaxed">
                Al continuar, aceptas nuestros <span className="underline cursor-pointer">Términos de Servicio</span> y <span className="underline cursor-pointer">Política de Privacidad</span>.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
