use std::{fmt::Display, future::Future, time::Duration};

use rand::{Rng, SeedableRng};

/// Applies a jitter + exponential backoff
/// 
/// The `usize` in the closure represents the attempt number
pub async fn retry_with_backoff<T, E, F, Fut>(
    function: F,
    max_retries: usize,
    initial_delay: Duration,
) -> Result<T, String>
where
    F: Fn(usize) -> Fut,
    Fut: Future<Output = Result<T, E>>,
    E: Display,
{
    let mut delay = initial_delay;
    // Use a thread-safe RNG
    let mut rng = rand_chacha::ChaChaRng::from_entropy();

    for attempt in 1..=max_retries {
        match function(attempt).await {
            Ok(result) => return Ok(result),
            Err(_) if attempt < max_retries => {
                // Add jitter: Randomize delay within 50%-150% of the current delay
                let jitter: f64 = rng.gen_range(0.5..1.5);
                let jittered_delay = delay.mul_f64(jitter);

                tokio::time::sleep(jittered_delay).await;

                // Exponential backoff: Double the delay for the next attempt
                delay *= 2;
            }
            Err(err) => {
                return Err(format!(
                    "Function failed after {} attempts. Last error: {}",
                    max_retries, err
                ));
            }
        }
    }
    unreachable!() // This should never be reached because all cases are handled above.
}
