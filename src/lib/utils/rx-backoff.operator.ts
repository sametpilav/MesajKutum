import { Observable, defer, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, retry } from 'rxjs/operators';
import { RetryConfig } from '../models/mailbox.models';

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 4,
  initialDelayMs: 1000,
  maxDelayMs: 16000
};

/**
 * Bir RxJS Observable akışında hata meydana geldiğinde katlanarak artan
 * gecikme süreleriyle (exponential backoff) otomatik yeniden deneme yapan operatör.
 * 
 * @param config Yeniden deneme ayarları (maxRetries, initialDelayMs, maxDelayMs)
 * @param onRetryDenial İsteğe bağlı her yeniden denemede tetiklenen geri çağırım fonksiyonu
 * 
 * @example
 * this.http.get('/api/threads').pipe(
 *   backoffRetry({ maxRetries: 3, initialDelayMs: 1000 }, (attempt, delay) => {
 *     console.log(`Bağlantı koptu, ${attempt}. deneme ${delay}ms sonra...`);
 *   })
 * )
 */
export function backoffRetry<T>(
  config?: RetryConfig,
  onRetry?: (attempt: number, delayMs: number, error: any) => void
) {
  const { maxRetries, initialDelayMs, maxDelayMs } = {
    ...DEFAULT_RETRY_CONFIG,
    ...(config || {})
  };

  return (source: Observable<T>): Observable<T> => {
    return source.pipe(
      retry({
        count: maxRetries,
        delay: (error: any, retryCount: number) => {
          // 2^(retryCount - 1) * initialDelayMs (örn: 1000ms, 2000ms, 4000ms, 8000ms...)
          const delay = Math.min(
            initialDelayMs * Math.pow(2, retryCount - 1),
            maxDelayMs
          );

          if (onRetry) {
            onRetry(retryCount, delay, error);
          }

          return timer(delay);
        }
      })
    );
  };
}
