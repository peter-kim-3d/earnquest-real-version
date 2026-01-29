/**
 * Safari compatibility for Web Audio API
 * Safari uses webkitAudioContext instead of AudioContext
 */
interface Window {
  webkitAudioContext: typeof AudioContext;
}
