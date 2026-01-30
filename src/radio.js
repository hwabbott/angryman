// Radio System - Plays MIDI songs through Web Audio synthesis
import { song0 } from './songs/song0.js'
import { song1 } from './songs/song1.js'
import { song2 } from './songs/song2.js'
import { song3 } from './songs/song3.js'
import { song4 } from './songs/song4.js'
import { song5 } from './songs/song5.js'
import { song6 } from './songs/song6.js'
import { song7 } from './songs/song7.js'
import { song10 as song8 } from './songs/song10.js'
import { song9 } from './songs/song9.js'

let audioCtx = null
let masterGain = null
let isPlaying = false
let currentChannel = 1
let volume = 0.8 // 0 to 1
let scheduleInterval = null
let songStartTime = 0
let currentSongTime = 0

// Song library - 10 channels (0-9)
const SONGS = {
  0: song0,
  1: song1,
  2: song2,
  3: song3,
  4: song4,
  5: song5,
  6: song6,
  7: song7,
  8: song8,
  9: song9,
}

// Track which notes have been scheduled (by track and note index)
let scheduledNoteIndices = {}

// Convert MIDI note number to frequency
const midiToFreq = (midi) => {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

// Get output node (master gain or destination)
const getOutput = () => masterGain || audioCtx.destination

// Create a note with envelope
const playNote = (ctx, freq, startTime, duration, type = 'square', trackVol = 0.1, velocity = 1) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(getOutput())

  osc.type = type
  osc.frequency.value = freq

  const vol = trackVol * velocity * 0.5

  const attackEnd = startTime + 0.01
  const releaseStart = startTime + Math.max(0.02, duration - 0.02)

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(vol, attackEnd)
  gain.gain.setValueAtTime(vol, releaseStart)
  gain.gain.linearRampToValueAtTime(0, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration + 0.01)
}

// Drum sounds
const playDrum = (ctx, midi, time, volume = 0.3, velocity = 1) => {
  const vol = volume * velocity

  // Kick drum - MIDI 35, 36
  if (midi === 35 || midi === 36) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(getOutput())
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)
    osc.start(time)
    osc.stop(time + 0.2)
  }
  // Snare - MIDI 38, 40
  else if (midi === 38 || midi === 40) {
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noise.connect(noiseGain)
    noiseGain.connect(getOutput())
    noiseGain.gain.setValueAtTime(vol * 0.6, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
    noise.start(time)
    noise.stop(time + 0.15)

    // Tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(getOutput())
    osc.frequency.value = 200
    gain.gain.setValueAtTime(vol * 0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
    osc.start(time)
    osc.stop(time + 0.1)
  }
  // Hi-hat closed - MIDI 42, 44
  else if (midi === 42 || midi === 44) {
    const bufferSize = ctx.sampleRate * 0.05
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000
    const noiseGain = ctx.createGain()
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(getOutput())
    noiseGain.gain.setValueAtTime(vol * 0.3, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)
    noise.start(time)
    noise.stop(time + 0.05)
  }
  // Hi-hat open - MIDI 46
  else if (midi === 46) {
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 7000
    const noiseGain = ctx.createGain()
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(getOutput())
    noiseGain.gain.setValueAtTime(vol * 0.35, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)
    noise.start(time)
    noise.stop(time + 0.15)
  }
  // Crash/Ride - MIDI 49, 51, 52, 55, 57
  else if ([49, 51, 52, 55, 57].includes(midi)) {
    const bufferSize = ctx.sampleRate * 0.4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 5000
    const noiseGain = ctx.createGain()
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(getOutput())
    noiseGain.gain.setValueAtTime(vol * 0.4, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4)
    noise.start(time)
    noise.stop(time + 0.4)
  }
  // Toms - MIDI 41, 43, 45, 47, 48, 50
  else if ([41, 43, 45, 47, 48, 50].includes(midi)) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(getOutput())
    const baseFreq = 80 + (midi - 41) * 15
    osc.frequency.setValueAtTime(baseFreq * 1.5, time)
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.1)
    gain.gain.setValueAtTime(vol * 0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)
    osc.start(time)
    osc.stop(time + 0.2)
  }
  // Other percussion
  else {
    const bufferSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noise.connect(noiseGain)
    noiseGain.connect(getOutput())
    noiseGain.gain.setValueAtTime(vol * 0.2, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08)
    noise.start(time)
    noise.stop(time + 0.08)
  }
}

// Schedule notes in a time window (streaming approach)
const scheduleNotesInWindow = (song, windowStart, windowEnd) => {
  if (!song || !audioCtx) return

  song.tracks.forEach((track, trackIdx) => {
    if (!scheduledNoteIndices[trackIdx]) {
      scheduledNoteIndices[trackIdx] = 0
    }

    // Start from where we left off
    for (let i = scheduledNoteIndices[trackIdx]; i < track.notes.length; i++) {
      const note = track.notes[i]

      // If note is past our window, stop (notes are sorted by time)
      if (note.time > windowEnd) break

      // If note is in our window, schedule it
      if (note.time >= windowStart && note.time < windowEnd) {
        const audioTime = songStartTime + note.time

        if (audioTime > audioCtx.currentTime) {
          if (track.synthType === 'drum') {
            playDrum(audioCtx, note.midi, audioTime, track.volume, note.velocity)
          } else {
            const freq = midiToFreq(note.midi)
            playNote(audioCtx, freq, audioTime, note.duration, track.synthType, track.volume, note.velocity)
          }
        }

        scheduledNoteIndices[trackIdx] = i + 1
      }
    }
  })
}

// Main scheduler - runs every 100ms to schedule upcoming notes
const runScheduler = () => {
  if (!isPlaying || !audioCtx) return

  const song = SONGS[currentChannel]
  if (!song) return

  // Calculate current position in song
  currentSongTime = audioCtx.currentTime - songStartTime

  // Check if song ended - loop it
  if (currentSongTime > song.duration) {
    songStartTime = audioCtx.currentTime
    currentSongTime = 0
    scheduledNoteIndices = {}
  }

  // Schedule notes for next 2 seconds
  const lookAhead = 2.0
  scheduleNotesInWindow(song, currentSongTime, currentSongTime + lookAhead)
}

// Start playing
export const startRadio = () => {
  if (isPlaying) return

  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }

  // Create master gain for volume control
  if (!masterGain) {
    masterGain = audioCtx.createGain()
    masterGain.connect(audioCtx.destination)
    masterGain.gain.value = volume
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  isPlaying = true
  songStartTime = audioCtx.currentTime
  currentSongTime = 0
  scheduledNoteIndices = {}

  // Start the scheduler
  scheduleInterval = setInterval(runScheduler, 100)
  runScheduler() // Run immediately
}

// Stop playing
export const stopRadio = () => {
  isPlaying = false

  if (scheduleInterval) {
    clearInterval(scheduleInterval)
    scheduleInterval = null
  }
}

// Change channel
export const setChannel = (channel) => {
  if (channel < 0 || channel > 9) return

  currentChannel = channel

  // Reset song position when changing channels
  if (isPlaying && audioCtx) {
    songStartTime = audioCtx.currentTime
    currentSongTime = 0
    scheduledNoteIndices = {}
  }
}

export const getChannel = () => currentChannel
export const isRadioPlaying = () => isPlaying

export const getSongInfo = (channel) => {
  const song = SONGS[channel]
  if (!song) return { name: 'No Signal', artist: '---' }
  return { name: song.name, artist: song.artist }
}

export const getCurrentSongInfo = () => getSongInfo(currentChannel)

// Volume controls
export const setVolume = (vol) => {
  volume = Math.max(0, Math.min(1, vol))
  if (masterGain) {
    masterGain.gain.value = volume
  }
}

export const getVolume = () => volume

export const volumeUp = () => {
  setVolume(volume + 0.1)
  return volume
}

export const volumeDown = () => {
  setVolume(volume - 0.1)
  return volume
}
