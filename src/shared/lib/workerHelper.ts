// Shared utility to run dashboard calculations on a background Web Worker
const workerCode = () => {
  self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;
    
    if (type === 'COMPUTE_MRR_EVOLUTION') {
      const { clientes } = payload;
      const months: any[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
          mrr: 0
        });
      }

      months.forEach(m => {
        const eom = new Date(m.year, m.month + 1, 0); // end of month
        
        const mrrForMonth = clientes.reduce((acc: number, client: any) => {
          const clientStart = client.startDate || client.createdAt || client.conversionDate;
          if (!clientStart) return acc;
          
          let sd: Date;
          if (clientStart.includes('/')) {
            const parts = clientStart.split('/');
            sd = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          } else {
            sd = new Date(clientStart);
          }
          
          if (sd <= eom && client.status === 'active') {
            return acc + (client.mrrValue || client.monthlySpend || client.monthlyRevenue || 0);
          }
          return acc;
        }, 0);
        
        m.mrr = mrrForMonth;
      });

      self.postMessage({ type: 'COMPUTE_MRR_EVOLUTION_RESULT', data: months });
    } else if (type === 'COMPUTE_REVENUE_FORECAST') {
      const { transactions, startDate, endDate } = payload;
      
      const parseDate = (dStr: string): Date => {
        if (dStr.includes('/')) {
          const parts = dStr.split('/');
          return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        }
        return new Date(dStr);
      };

      const isDateInRange = (dateStr: string, startStr: string, endStr: string) => {
        if (!dateStr) return false;
        const d = parseDate(dateStr);
        if (isNaN(d.getTime())) return false;
        const start = new Date(startStr);
        const end = new Date(endStr);
        return d >= start && d <= end;
      };

      const validTransactions = transactions.filter((t: any) => t.type === 'income' && isDateInRange(t.dueDate, startDate, endDate));
      
      const byDate = validTransactions.reduce((acc: any, t: any) => {
        const date = t.dueDate;
        if (!acc[date]) acc[date] = { previsto: 0, realizado: 0 };
        acc[date].previsto += t.value;
        if (t.status === 'Pago' || t.status === 'Recebido') acc[date].realizado += t.value;
        return acc;
      }, {});

      const sortedDates = Object.keys(byDate).sort();
      let cumPrevisto = 0;
      let cumRealizado = 0;

      const result = sortedDates.map(date => {
        cumPrevisto += byDate[date].previsto;
        cumRealizado += byDate[date].realizado;
        const d = parseDate(date);
        const name = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;
        return {
          name,
          previsto: cumPrevisto,
          realizado: cumRealizado
        };
      });

      self.postMessage({ type: 'COMPUTE_REVENUE_FORECAST_RESULT', data: result });
    }
  };
};

const code = `(${workerCode.toString()})()`;
const blob = new Blob([code], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);

export const runInWorker = <T, R>(type: string, payload: T): Promise<R> => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported in this environment');
      }
      const worker = new Worker(workerUrl);
      worker.onmessage = (e) => {
        if (e.data && e.data.type === `${type}_RESULT`) {
          resolve(e.data.data);
          worker.terminate();
        }
      };
      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
      };
      worker.postMessage({ type, payload });
    } catch (err) {
      reject(err);
    }
  });
};
