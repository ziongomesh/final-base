import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

interface Alert {
  id: number;
  message: string;
  from_name: string;
  created_at: string;
}

interface AlertNotificationProps {
  adminId: number;
}

export default function AlertNotification({ adminId }: AlertNotificationProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAlerts();
  }, [adminId]);

  const fetchAlerts = async () => {
    try {
      const data = await api.alerts.getUnread();
      setAlerts(data || []);
    } catch (e) {
      console.error('Erro ao buscar alertas:', e);
    }
  };

  const handleDismiss = async () => {
    const current = alerts[currentIndex];
    if (current) {
      try {
        await api.alerts.markRead([current.id]);
      } catch (e) {
        console.error(e);
      }
    }

    if (currentIndex < alerts.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setAlerts([]);
    }
  };

  if (alerts.length === 0) return null;

  const current = alerts[currentIndex];

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-sm border-amber-500/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            Alerta do Sistema
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm pt-2">
            {current.message}
          </AlertDialogDescription>
          {current.from_name && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Enviado por: {current.from_name}
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogAction onClick={handleDismiss} className="w-full">
          Entendi
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
