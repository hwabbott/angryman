import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { startRadio, stopRadio, setChannel, getChannel, getCurrentSongInfo, isRadioPlaying, volumeUp, volumeDown, getVolume } from './radio'

const LANE_COUNT = 4
const POSITIONS_PER_LANE = 3
const TOTAL_POSITIONS = LANE_COUNT * POSITIONS_PER_LANE
const ROAD_WIDTH = 180

// 11 Vehicle designs with knock-off names
const VEHICLES = [
  {
    name: 'Hamborghini',
    art: [
      '      __________',
      '  ___/  ____    \\___',
      ' /  |__|    |__|   _\\',
      '|_____(O)____(O)_____|',
    ]
  },
  {
    name: 'Stresla',
    art: [
      '    ___________',
      '   |  _______  |___',
      '  /|_|       |_|   \\',
      ' |_____(O)___(O)____|',
    ]
  },
  {
    name: 'Awwdi',
    art: [
      '    ____________',
      '   /   oooo     \\__',
      '  |  |______|   |  |',
      '  |___(O)____(O)___|',
    ]
  },
  {
    name: 'Purrari',
    art: [
      '       _________',
      '   ___/   __    \\_',
      '  <__||__|  |__|| >',
      '    (O)      (O)',
    ]
  },
  {
    name: 'Furd',
    art: [
      '    ____   _______',
      '   | __ |_|       |',
      '   ||  ||_________|',
      '   (O)        (O)',
    ]
  },
  {
    name: 'Toyoda',
    art: [
      '     _______',
      '    /  ___  \\__',
      '   |  |___|    |',
      '   |_(O)___(O)_|',
    ]
  },
  {
    name: 'Hawnda',
    art: [
      '      _____',
      '     / ___ \\_',
      '    | |___| |',
      '    |_(O)_(O)|',
    ]
  },
  {
    name: 'Bummer',
    art: [
      '   ______________',
      '  |  ___    ___  |',
      '  | |   |  |   | |',
      '  | |___|  |___| |',
      '  |__(O)____(O)__|',
    ]
  },
  {
    name: 'Doge',
    art: [
      '      __________',
      '  ___/    __    \\',
      ' |   |___|  |___|==',
      ' |____(O)____(O)__|',
    ]
  },
  {
    name: 'Yamaahaa',
    art: [
      '     ,__',
      '    /o  \\@',
      '   _\\__/_|',
      '    (O)(O)',
    ]
  },
  {
    name: 'Majik Karpet',
    art: [
      '  ~~~~~~~~~~~',
      ' <|  @ _ @  |>',
      '  ~~~~~~~~~~~',
      '   ^ ^ ^ ^ ^',
    ]
  }
]

// Bright primary and secondary colors
const CAR_COLORS = [
  { name: 'Red', color: '#ff0000' },
  { name: 'Blue', color: '#0066ff' },
  { name: 'Yellow', color: '#ffff00' },
  { name: 'Orange', color: '#ff8800' },
  { name: 'Green', color: '#00ff00' },
  { name: 'Purple', color: '#cc00ff' },
]

// ASCII art for a person
const PERSON_ART = [
  '  O',
  ' /|\\',
  ' / \\',
]

// ASCII art for a flattened person
const FLATTENED_ART = [
  '____',
  'xXXx',
]

// ASCII art for a cat
const CAT_ART = [
  ' /\\_/\\',
  '( o.o )',
  ' > ^ <',
]

// ASCII art for a flattened cat
const CAT_FLATTENED_ART = [
  '~~~~~',
  'xXXXx',
]

const PERSON_HEIGHT = PERSON_ART.length
const PERSON_WIDTH = 4
const CAT_HEIGHT = CAT_ART.length
const CAT_WIDTH = 7

// Hitbox sizes (for collision detection)
const PERSON_HITBOX = 4 // 4x4 square
const CAR_HITBOX_WIDTH = 8
const CAR_HITBOX_HEIGHT = 4

// Road speed multiplier
const ROAD_SPEED = 2

// ASCII art for potholes - solid black
const POTHOLE_SMALL = [
  '████',
  '████',
]

const POTHOLE_LARGE = [
  '██████████',
  '██████████',
  '██████████',
  '██████████',
  '██████████',
  '██████████',
  '██████████',
]

const POTHOLE_SMALL_HEIGHT = POTHOLE_SMALL.length
const POTHOLE_SMALL_WIDTH = 4
const POTHOLE_LARGE_HEIGHT = POTHOLE_LARGE.length
const POTHOLE_LARGE_WIDTH = 10

// Audio context for sound effects
let audioCtx = null

// Preload hit sound MP3
const hitSound = new Audio('./hit.mp3')
hitSound.volume = 0.25 // Reduced by 50%

const playHitSound = () => {
  hitSound.currentTime = 0
  hitSound.play().catch(() => {})
}

// Preload game over sound MP3
const gameOverSound = new Audio('./gameover.mp3')
gameOverSound.volume = 0.7

const playGameOverSound = () => {
  gameOverSound.currentTime = 0
  gameOverSound.play().catch(() => {})
}

// Preload cat hit sound
const catSound = new Audio('./cat.wav')
catSound.volume = 0.6

const playCatSound = () => {
  catSound.currentTime = 0
  catSound.play().catch(() => {})
}

// Preload pothole hit sound
const potholeSound = new Audio('./pothole.wav')
potholeSound.volume = 0.5

const playPotholeSound = () => {
  potholeSound.currentTime = 0
  potholeSound.play().catch(() => {})
}

const playBumpSound = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }

  const now = audioCtx.currentTime

  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  oscillator.frequency.setValueAtTime(80, now)
  oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.1)
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.5, now)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

  oscillator.start(now)
  oscillator.stop(now + 0.15)

  const oscillator2 = audioCtx.createOscillator()
  const gainNode2 = audioCtx.createGain()

  oscillator2.connect(gainNode2)
  gainNode2.connect(audioCtx.destination)

  oscillator2.frequency.setValueAtTime(60, now + 0.08)
  oscillator2.frequency.exponentialRampToValueAtTime(30, now + 0.18)
  oscillator2.type = 'sine'

  gainNode2.gain.setValueAtTime(0.3, now + 0.08)
  gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.2)

  oscillator2.start(now + 0.08)
  oscillator2.stop(now + 0.2)
}

// Load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('angryManSettings')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load settings', e)
  }
  return {
    vehicleIndex: 0,
    colorIndex: 0,
    carName: 'Speedy'
  }
}

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('angryManSettings', JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings', e)
  }
}

// Random car names
const RANDOM_NAMES = [
  'Speedy', 'Thunder', 'Lightning', 'Rocket', 'Blaze', 'Storm', 'Fury', 'Rage',
  'Crusher', 'Dasher', 'Zoom', 'Flash', 'Bolt', 'Nitro', 'Turbo', 'Venom'
]

function App() {
  // Game screen state: 'start', 'playing', 'gameover'
  const [screen, setScreen] = useState('start')
  const [radioOn, setRadioOn] = useState(false)
  const [radioChannel, setRadioChannel] = useState(1)
  const [radioVolume, setRadioVolume] = useState(0.8)

  // Settings (persisted)
  const [vehicleIndex, setVehicleIndex] = useState(() => loadSettings().vehicleIndex)
  const [colorIndex, setColorIndex] = useState(() => loadSettings().colorIndex)
  const [carName, setCarName] = useState(() => loadSettings().carName)

  // Game state
  const [playerPosition, setPlayerPosition] = useState(4)
  const [playerX, setPlayerX] = useState(2)
  const [lineOffset, setLineOffset] = useState(0)
  const [people, setPeople] = useState([])
  const [potholes, setPotholes] = useState([])
  const [trafficCars, setTrafficCars] = useState([])
  const [hitCount, setHitCount] = useState(0)
  const [tiresLeft, setTiresLeft] = useState(4)

  const nextPersonId = useRef(0)
  const nextPotholeId = useRef(0)
  const nextTrafficCarId = useRef(0)
  const trafficSpawnTimer = useRef(0)
  const laneSpeeds = useRef([])
  const countedHits = useRef(new Set())
  const countedPotholeHits = useRef(new Set())
  const countedCarHits = useRef(new Set())
  const keysDown = useRef(new Set())
  const moveToggle = useRef(0)
  const potholeSpawnTimer = useRef(0)
  const prevPlayerX = useRef(2)
  const prevPlayerPos = useRef(4)
  const blockedDirections = useRef({ left: false, right: false, up: false, down: false })

  // Get current vehicle
  const currentVehicle = VEHICLES[vehicleIndex]
  const CAR_ART = currentVehicle.art
  const CAR_HEIGHT = CAR_ART.length
  const CAR_WIDTH = Math.max(...CAR_ART.map(line => line.length))
  const carColor = CAR_COLORS[colorIndex].color

  // Save settings when they change
  useEffect(() => {
    saveSettings({ vehicleIndex, colorIndex, carName })
  }, [vehicleIndex, colorIndex, carName])

  // Check for game over
  const isGameOver = tiresLeft <= 0

  // Handle game over - play sound and stop radio
  useEffect(() => {
    if (isGameOver && screen === 'playing') {
      playGameOverSound()
      if (radioOn) {
        stopRadio()
        setRadioOn(false)
      }
    }
  }, [isGameOver, screen, radioOn])

  // Reset game state
  const resetGame = () => {
    setPlayerPosition(4)
    setPlayerX(2)
    setPeople([])
    setPotholes([])
    setTrafficCars([])
    setHitCount(0)
    setTiresLeft(4)
    nextPersonId.current = 0
    nextPotholeId.current = 0
    nextTrafficCarId.current = 0
    trafficSpawnTimer.current = 0
    // Initialize random speeds for each lane
    // One random lane goes twice as fast (passing lane)
    const fastLane = Math.floor(Math.random() * LANE_COUNT)
    laneSpeeds.current = Array.from({ length: LANE_COUNT }, (_, i) => {
      const baseSpeed = 0.3 + Math.random() * 0.55
      return i === fastLane ? baseSpeed * 2 : baseSpeed
    })
    countedHits.current = new Set()
    countedPotholeHits.current = new Set()
    countedCarHits.current = new Set()
    potholeSpawnTimer.current = 0
    prevPlayerX.current = 2
    prevPlayerPos.current = 4
  }

  const startGame = () => {
    resetGame()
    setScreen('playing')
    if (radioOn) startRadio()
  }

  const goToStart = () => {
    setScreen('start')
    stopRadio()
  }

  const toggleRadio = () => {
    if (radioOn) {
      stopRadio()
      setRadioOn(false)
    } else {
      startRadio()
      setRadioOn(true)
    }
  }

  const changeChannel = (channel) => {
    setRadioChannel(channel)
    setChannel(channel)
  }

  // Get current song info for display
  const songInfo = getCurrentSongInfo()

  // Keyboard handlers
  const handleKeyDown = useCallback((e) => {
    // Number keys 0-9 for radio channels (work anytime during gameplay)
    if (screen === 'playing' && e.key >= '0' && e.key <= '9') {
      const channel = parseInt(e.key)
      setRadioChannel(channel)
      setChannel(channel)
      // Auto-enable radio when switching channels
      if (!radioOn) {
        setRadioOn(true)
        startRadio()
      }
      return
    }

    // Volume controls with +/- keys
    if (screen === 'playing' && (e.key === '-' || e.key === '_')) {
      const newVol = volumeDown()
      setRadioVolume(newVol)
      if (newVol === 0) {
        stopRadio()
        setRadioOn(false)
      }
      return
    }
    if (screen === 'playing' && (e.key === '=' || e.key === '+')) {
      const newVol = volumeUp()
      setRadioVolume(newVol)
      if (!radioOn && newVol > 0) {
        setRadioOn(true)
        startRadio()
      }
      return
    }

    if (screen !== 'playing' || isGameOver) return
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      keysDown.current.add(e.key)
    }
  }, [screen, isGameOver, radioOn])

  const handleKeyUp = useCallback((e) => {
    keysDown.current.delete(e.key)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Movement - arrow keys directly control position (respecting blocked directions)
  useEffect(() => {
    if (screen !== 'playing' || isGameOver) return

    const interval = setInterval(() => {
      const keys = keysDown.current
      const blocked = blockedDirections.current

      // Up/Down: change lane position (only if not blocked)
      if (keys.has('ArrowUp') && !blocked.up) {
        setPlayerPosition(pos => Math.max(0, pos - 1))
      }
      if (keys.has('ArrowDown') && !blocked.down) {
        setPlayerPosition(pos => Math.min(TOTAL_POSITIONS - 1, pos + 1))
      }

      // Left/Right: move car position directly (only if not blocked)
      if (keys.has('ArrowLeft') && !blocked.left) {
        setPlayerX(x => Math.max(0, x - 3))
      }
      if (keys.has('ArrowRight') && !blocked.right) {
        setPlayerX(x => Math.min(ROAD_WIDTH - CAR_WIDTH - 2, x + 3))
      }
    }, 80)

    return () => clearInterval(interval)
  }, [screen, isGameOver, CAR_WIDTH])

  // Road animation - faster to match ROAD_SPEED
  useEffect(() => {
    if (screen !== 'playing') return
    if (isGameOver) return // Stop road when game over

    const interval = setInterval(() => {
      setLineOffset(offset => (offset + ROAD_SPEED) % 8)
    }, 100)
    return () => clearInterval(interval)
  }, [screen, isGameOver])

  // Player position refs
  const playerXRef = useRef(playerX)
  const playerPositionRef = useRef(playerPosition)

  useEffect(() => {
    // Track previous position before updating
    prevPlayerX.current = playerXRef.current
    prevPlayerPos.current = playerPositionRef.current
    playerXRef.current = playerX
    playerPositionRef.current = playerPosition
  }, [playerX, playerPosition])

  // Pothole spawning and movement
  useEffect(() => {
    if (screen !== 'playing') return
    if (isGameOver) return

    const interval = setInterval(() => {
      const currentPlayerX = playerXRef.current
      const currentPlayerPos = playerPositionRef.current

      setPotholes(currentPotholes => {
        let updatedPotholes = currentPotholes.map(pothole => ({
          ...pothole,
          x: pothole.x - ROAD_SPEED
        }))

        updatedPotholes = updatedPotholes.filter(pothole => {
          const width = pothole.size === 'small' ? POTHOLE_SMALL_WIDTH : POTHOLE_LARGE_WIDTH
          return pothole.x > -width
        })

        for (const pothole of updatedPotholes) {
          if (countedPotholeHits.current.has(pothole.id)) continue

          const potholeWidth = pothole.size === 'small' ? POTHOLE_SMALL_WIDTH : POTHOLE_LARGE_WIDTH

          const carLeft = currentPlayerX
          const carRight = currentPlayerX + CAR_WIDTH
          const potholeLeft = pothole.x
          const potholeRight = pothole.x + potholeWidth

          const horizontalOverlap = carLeft < potholeRight && carRight > potholeLeft

          const potholeTopPos = pothole.lane * POSITIONS_PER_LANE
          const potholeBottomPos = potholeTopPos + POSITIONS_PER_LANE - 1
          const carTopPos = currentPlayerPos
          const carBottomPos = currentPlayerPos + 2

          const verticalOverlap = carTopPos <= potholeBottomPos && carBottomPos >= potholeTopPos

          if (horizontalOverlap && verticalOverlap) {
            countedPotholeHits.current.add(pothole.id)
            setTiresLeft(t => Math.max(0, t - 1))
            playPotholeSound()
          }
        }

        potholeSpawnTimer.current++
        if (potholeSpawnTimer.current >= 10) {
          potholeSpawnTimer.current = 0
          if (Math.random() < 0.01) {
            const lane = Math.floor(Math.random() * LANE_COUNT)
            updatedPotholes.push({
              id: nextPotholeId.current++,
              x: ROAD_WIDTH,
              lane,
              size: 'small'
            })
          }
        }

        return updatedPotholes
      })
    }, 100)

    return () => clearInterval(interval)
  }, [screen, isGameOver, CAR_WIDTH])

  // People and cats spawning and movement
  useEffect(() => {
    if (screen !== 'playing') return

    const interval = setInterval(() => {
      const currentPlayerX = playerXRef.current
      const currentPlayerPos = playerPositionRef.current

      setPeople(currentPeople => {
        let newPersonHits = 0
        let newCatHits = 0

        let updatedPeople = currentPeople.map(entity => {
          // Only move if game not over - use ROAD_SPEED
          let newX = isGameOver ? entity.x : entity.x - ROAD_SPEED

          if (entity.flattened) {
            return { ...entity, x: newX }
          }

          let newLanePosition = entity.lanePosition
          let newWalkTimer = (entity.walkTimer || 0) + 1

          // Walk - cats move twice as fast
          if (newWalkTimer >= entity.walkSpeed) {
            newWalkTimer = 0
            newLanePosition = entity.lanePosition + entity.walkDirection
          }

          // Only check collisions if game not over
          if (!isGameOver) {
            // Hitbox: 4x4 centered on entity
            const entityWidth = entity.type === 'cat' ? CAT_WIDTH : PERSON_WIDTH
            const entityCenterX = newX + entityWidth / 2
            const entityLeft = entityCenterX - PERSON_HITBOX / 2
            const entityRight = entityCenterX + PERSON_HITBOX / 2

            // Player car hitbox (full width for now)
            const carLeft = currentPlayerX
            const carRight = currentPlayerX + CAR_WIDTH
            const horizontalOverlap = carLeft < entityRight && carRight > entityLeft

            // Vertical: hitbox is 4 positions tall centered on their position
            const entityTopPos = newLanePosition - PERSON_HITBOX / 2
            const entityBottomPos = newLanePosition + PERSON_HITBOX / 2
            const carTopPos = currentPlayerPos
            const carBottomPos = currentPlayerPos + 2
            const verticalOverlap = carTopPos < entityBottomPos && carBottomPos > entityTopPos

            if (horizontalOverlap && verticalOverlap) {
              if (!countedHits.current.has(entity.id)) {
                countedHits.current.add(entity.id)
                if (entity.type === 'cat') {
                  newCatHits++
                } else {
                  newPersonHits++
                }
              }
              return {
                ...entity,
                x: newX,
                lanePosition: newLanePosition,
                walkTimer: newWalkTimer,
                flattened: true
              }
            }
          }

          return {
            ...entity,
            x: newX,
            lanePosition: newLanePosition,
            walkTimer: newWalkTimer
          }
        })

        updatedPeople = updatedPeople.filter(entity => {
          const width = entity.type === 'cat' ? CAT_WIDTH : PERSON_WIDTH
          return entity.x > -width &&
            (entity.flattened || (entity.lanePosition >= 0 && entity.lanePosition < TOTAL_POSITIONS))
        })

        // Spawn people (1/3 of original rate: 0.05 / 3 ≈ 0.017)
        if (Math.random() < 0.017) {
          const fromTop = Math.random() < 0.5
          const lanePosition = fromTop ? 0 : TOTAL_POSITIONS - 1
          const walkDirection = fromTop ? 1 : -1
          const minX = Math.floor(ROAD_WIDTH * 0.25)
          const x = minX + Math.floor(Math.random() * (ROAD_WIDTH - minX))
          const walkSpeed = 1 + Math.floor(Math.random() * 4)
          updatedPeople.push({
            id: nextPersonId.current++,
            x,
            lanePosition,
            walkDirection,
            walkSpeed,
            walkTimer: 0,
            flattened: false,
            type: 'person'
          })
        }

        // Spawn cats (same rate as people, cats move half as fast)
        if (Math.random() < 0.017) {
          const fromTop = Math.random() < 0.5
          const lanePosition = fromTop ? 0 : TOTAL_POSITIONS - 1
          const walkDirection = fromTop ? 1 : -1
          const minX = Math.floor(ROAD_WIDTH * 0.25)
          const x = minX + Math.floor(Math.random() * (ROAD_WIDTH - minX))
          // Cats move half as fast (double the walk speed timer)
          const walkSpeed = (1 + Math.floor(Math.random() * 4)) * 2
          updatedPeople.push({
            id: nextPersonId.current++,
            x,
            lanePosition,
            walkDirection,
            walkSpeed,
            walkTimer: 0,
            flattened: false,
            type: 'cat'
          })
        }

        // Play appropriate sounds (same sound for person and cat)
        if (newPersonHits > 0) {
          playCatSound()
          setHitCount(c => c + newPersonHits)
        }
        if (newCatHits > 0) {
          playCatSound()
          setHitCount(c => c + newCatHits)
        }

        return updatedPeople
      })
    }, 100)
    return () => clearInterval(interval)
  }, [screen, isGameOver, CAR_WIDTH])

  // Traffic car spawning and movement
  useEffect(() => {
    if (screen !== 'playing') return

    const interval = setInterval(() => {
      const currentPlayerX = playerXRef.current
      const currentPlayerPos = playerPositionRef.current

      setTrafficCars(currentCars => {
        // Move existing cars - multiply by ROAD_SPEED for faster gameplay
        // Cars keep moving even after game over
        let updatedCars = currentCars.map(car => ({
          ...car,
          x: car.x - car.speed * ROAD_SPEED
        }))

        // Reset blocked directions each frame
        blockedDirections.current = { left: false, right: false, up: false, down: false }

        // Only check for collisions if game not over
        if (!isGameOver) {
          for (const car of updatedCars) {
            const trafficVehicle = VEHICLES[car.vehicleIdx]
            if (!trafficVehicle) continue
            const trafficWidth = Math.max(...trafficVehicle.art.map(l => l.length))

            // Traffic car hitbox: 8 wide x 4 high, centered on car
            const trafficCenterX = car.x + trafficWidth / 2
            const trafficLeft = trafficCenterX - CAR_HITBOX_WIDTH / 2
            const trafficRight = trafficCenterX + CAR_HITBOX_WIDTH / 2

            // Player car hitbox (full width)
            const carLeft = currentPlayerX
            const carRight = currentPlayerX + CAR_WIDTH
            const playerCenterX = currentPlayerX + CAR_WIDTH / 2
            const horizontalOverlap = carLeft < trafficRight && carRight > trafficLeft

            // Vertical: traffic car hitbox is 4 positions tall centered in lane
            const trafficLanePos = car.lane * POSITIONS_PER_LANE + 1 // Center of lane
            const trafficTopPos = trafficLanePos - CAR_HITBOX_HEIGHT / 2
            const trafficBottomPos = trafficLanePos + CAR_HITBOX_HEIGHT / 2
            const playerTopPos = currentPlayerPos
            const playerBottomPos = currentPlayerPos + 2
            const playerCenterPos = currentPlayerPos + 1
            const verticalOverlap = playerTopPos < trafficBottomPos && playerBottomPos > trafficTopPos

            if (horizontalOverlap && verticalOverlap) {
              // Play sound only once per collision
              if (!countedCarHits.current.has(car.id)) {
                countedCarHits.current.add(car.id)
                playBumpSound()
              }

              // Block movement in directions that would keep us colliding
              // Only allow movement AWAY from the traffic car
              if (playerCenterX < trafficCenterX) {
                // Player is to the left of traffic car - block right movement
                blockedDirections.current.right = true
              } else {
                // Player is to the right of traffic car - block left movement
                blockedDirections.current.left = true
              }

              if (playerCenterPos < trafficLanePos) {
                // Player is above traffic car - block down movement
                blockedDirections.current.down = true
              } else {
                // Player is below traffic car - block up movement
                blockedDirections.current.up = true
              }
            } else {
              // No longer colliding, allow re-triggering sound on next collision
              countedCarHits.current.delete(car.id)
            }
          }
        }

        // Remove cars that have left the screen
        updatedCars = updatedCars.filter(car => car.x > -30)

        // Spawn new cars (twice as often)
        trafficSpawnTimer.current++
        if (trafficSpawnTimer.current >= 10) {
          trafficSpawnTimer.current = 0
          if (Math.random() < 0.5) {
            const lane = Math.floor(Math.random() * LANE_COUNT)

            // Check if there's room in this lane (no car too close to spawn point)
            const carsInLane = updatedCars.filter(c => c.lane === lane)
            const minGap = 40 // Minimum gap between cars
            const rightmostCar = carsInLane.reduce((max, c) => c.x > max ? c.x : max, -Infinity)

            // Only spawn if the rightmost car in this lane has moved far enough left
            if (rightmostCar < ROAD_WIDTH - minGap) {
              // Pick random vehicle model
              const vehicleIdx = Math.floor(Math.random() * VEHICLES.length)
              // Pick random color that's not the player's color
              const availableColors = CAR_COLORS.map((c, i) => i).filter(i => i !== colorIndex)
              const carColorIdx = availableColors[Math.floor(Math.random() * availableColors.length)]
              // Use the lane's speed (slower than road=1, so cars appear to move forward)
              const speed = laneSpeeds.current[lane] || 0.5

              updatedCars.push({
                id: nextTrafficCarId.current++,
                x: ROAD_WIDTH + 10,
                lane,
                vehicleIdx,
                colorIdx: carColorIdx,
                speed
              })
            }
          }
        }

        return updatedCars
      })
    }, 100)

    return () => clearInterval(interval)
  }, [screen, isGameOver, colorIndex, CAR_WIDTH])

  // Lane divider generation
  const generateLaneLine = () => {
    let line = ''
    for (let i = 0; i < ROAD_WIDTH; i++) {
      const pos = (i + lineOffset) % 8
      line += pos < 4 ? '-' : ' '
    }
    return line
  }

  const ROWS_PER_LANE = 11
  const DIVIDER_ROWS = 1
  const TOTAL_ROAD_ROWS = (LANE_COUNT * ROWS_PER_LANE) + ((LANE_COUNT - 1) * DIVIDER_ROWS)

  const getRowFromPosition = (position, height) => {
    const rowsPerPosition = (TOTAL_ROAD_ROWS - height) / (TOTAL_POSITIONS - 1)
    return Math.round(position * rowsPerPosition)
  }

  const getCarStartRow = () => getRowFromPosition(playerPosition, CAR_HEIGHT)

  // Render road
  const renderRoad = () => {
    const rows = []
    const carStartRow = getCarStartRow()

    rows.push(<div key="top-edge" className="road-line edge">{'='.repeat(ROAD_WIDTH)}</div>)

    let currentRow = 0

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      for (let laneRow = 0; laneRow < ROWS_PER_LANE; laneRow++) {
        const carRowIndex = currentRow - carStartRow
        const charArray = Array.from({ length: ROAD_WIDTH }, () => ({ char: ' ', type: 0 }))

        // Draw potholes
        for (const pothole of potholes) {
          const potholeArt = pothole.size === 'small' ? POTHOLE_SMALL : POTHOLE_LARGE
          const potholeHeight = pothole.size === 'small' ? POTHOLE_SMALL_HEIGHT : POTHOLE_LARGE_HEIGHT

          const laneStartRow = pothole.lane * (ROWS_PER_LANE + DIVIDER_ROWS)
          const potholeStartRow = laneStartRow + Math.floor((ROWS_PER_LANE - potholeHeight) / 2)
          const potholeRowIndex = currentRow - potholeStartRow

          if (potholeRowIndex >= 0 && potholeRowIndex < potholeHeight) {
            const potholeLine = potholeArt[potholeRowIndex]
            for (let i = 0; i < potholeLine.length; i++) {
              const pos = Math.floor(pothole.x) + i
              if (pos >= 0 && pos < ROAD_WIDTH && potholeLine[i] !== ' ') {
                charArray[pos] = { char: potholeLine[i], type: 4 }
              }
            }
          }
        }

        // Draw traffic cars (before people and player so they appear behind)
        for (const trafficCar of trafficCars) {
          if (!trafficCar || trafficCar.vehicleIdx >= VEHICLES.length) continue
          const trafficVehicle = VEHICLES[trafficCar.vehicleIdx]
          if (!trafficVehicle) continue
          const trafficArt = trafficVehicle.art
          const trafficHeight = trafficArt.length

          // Traffic cars stay centered in their lane
          const laneStartRow = trafficCar.lane * (ROWS_PER_LANE + DIVIDER_ROWS)
          const trafficStartRow = laneStartRow + Math.floor((ROWS_PER_LANE - trafficHeight) / 2)
          const trafficRowIndex = currentRow - trafficStartRow

          if (trafficRowIndex >= 0 && trafficRowIndex < trafficHeight) {
            const trafficLine = trafficArt[trafficRowIndex]
            const trafficColor = CAR_COLORS[trafficCar.colorIdx]?.color || '#888'
            for (let i = 0; i < trafficLine.length; i++) {
              const pos = Math.floor(trafficCar.x) + i
              if (pos >= 0 && pos < ROAD_WIDTH && trafficLine[i] !== ' ') {
                charArray[pos] = { char: trafficLine[i], type: 5, color: trafficColor }
              }
            }
          }
        }

        // Draw people and cats
        for (const entity of people) {
          const isCat = entity.type === 'cat'
          let entityArt, entityHeight
          if (isCat) {
            entityArt = entity.flattened ? CAT_FLATTENED_ART : CAT_ART
            entityHeight = entity.flattened ? CAT_FLATTENED_ART.length : CAT_HEIGHT
          } else {
            entityArt = entity.flattened ? FLATTENED_ART : PERSON_ART
            entityHeight = entity.flattened ? FLATTENED_ART.length : PERSON_HEIGHT
          }
          const entityStartRow = getRowFromPosition(entity.lanePosition, entityHeight)
          const entityRowIndex = currentRow - entityStartRow

          if (entityRowIndex >= 0 && entityRowIndex < entityArt.length) {
            const entityLine = entityArt[entityRowIndex]
            // Type 2 = person alive, 3 = flattened, 6 = cat alive, 7 = cat flattened
            const entityType = entity.flattened ? (isCat ? 7 : 3) : (isCat ? 6 : 2)
            for (let i = 0; i < entityLine.length; i++) {
              const pos = Math.floor(entity.x) + i
              if (pos >= 0 && pos < ROAD_WIDTH && entityLine[i] !== ' ') {
                charArray[pos] = { char: entityLine[i], type: entityType }
              }
            }
          }
        }

        // Draw car
        if (carRowIndex >= 0 && carRowIndex < CAR_HEIGHT) {
          const carLine = CAR_ART[carRowIndex]
          for (let i = 0; i < carLine.length; i++) {
            const pos = playerX + i
            if (pos >= 0 && pos < ROAD_WIDTH && carLine[i] !== ' ') {
              charArray[pos] = { char: carLine[i], type: 1 }
            }
          }
        }

        // Convert to spans
        const parts = []
        let currentType = charArray[0].type
        let currentColor = charArray[0].color
        let currentStr = charArray[0].char

        const getClassName = (type) => {
          if (type === 1) return 'car-sprite'
          if (type === 2) return 'person-alive'
          if (type === 3) return 'person-flattened'
          if (type === 4) return 'pothole'
          if (type === 5) return 'traffic-car'
          if (type === 6) return 'cat-alive'
          if (type === 7) return 'cat-flattened'
          return ''
        }

        const getStyle = (type, color) => {
          if (type === 1) return { color: carColor }
          if (type === 5) return { color: color }
          return {}
        }

        for (let i = 1; i < ROAD_WIDTH; i++) {
          const sameType = charArray[i].type === currentType
          const sameColor = charArray[i].color === currentColor
          if (sameType && sameColor) {
            currentStr += charArray[i].char
          } else {
            parts.push(
              <span key={`span-${parts.length}`} className={getClassName(currentType)} style={getStyle(currentType, currentColor)}>
                {currentStr}
              </span>
            )
            currentType = charArray[i].type
            currentColor = charArray[i].color
            currentStr = charArray[i].char
          }
        }
        parts.push(
          <span key={`span-${parts.length}`} className={getClassName(currentType)} style={getStyle(currentType, currentColor)}>
            {currentStr}
          </span>
        )

        rows.push(
          <div key={`row-${currentRow}`} className="road-line lane">
            {parts}
          </div>
        )
        currentRow++
      }

      if (lane < LANE_COUNT - 1) {
        const carRowIndex = currentRow - carStartRow
        const dividerLine = generateLaneLine()

        if (carRowIndex >= 0 && carRowIndex < CAR_HEIGHT) {
          const carLine = CAR_ART[carRowIndex]
          const carStart = playerX
          const carEnd = carStart + carLine.length

          const beforeCar = dividerLine.substring(0, carStart)
          const afterCar = dividerLine.substring(carEnd)

          rows.push(
            <div key={`divider-${lane}`} className="road-line divider">
              <span>{beforeCar}</span>
              <span className="car-on-divider" style={{ color: carColor }}>{carLine}</span>
              <span>{afterCar}</span>
            </div>
          )
        } else {
          rows.push(
            <div key={`divider-${lane}`} className="road-line divider">
              {dividerLine}
            </div>
          )
        }
        currentRow++
      }
    }

    rows.push(<div key="bottom-edge" className="road-line edge">{'='.repeat(ROAD_WIDTH)}</div>)

    return rows
  }

  // Road pattern for start screen decoration
  const renderRoadPattern = () => {
    const lines = []
    for (let i = 0; i < 20; i++) {
      const offset = (i + lineOffset) % 4
      lines.push(
        <div key={i} className="road-pattern-line">
          {offset < 2 ? '|' : ' '}
        </div>
      )
    }
    return lines
  }

  // Start screen animation
  useEffect(() => {
    if (screen !== 'start') return
    const interval = setInterval(() => {
      setLineOffset(offset => (offset + 1) % 8)
    }, 200)
    return () => clearInterval(interval)
  }, [screen])

  // Random name generator
  const generateRandomName = () => {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
    setCarName(name)
  }

  // Render start screen
  if (screen === 'start') {
    return (
      <div className="app">
        <div className="start-screen">
          <div className="road-pattern left">{renderRoadPattern()}</div>

          <div className="start-content">
            <h1 className="game-title">Angry Man in a Car</h1>

            <div className="setup-panels">
              <div className="car-selection-panel">
                <h2>Car Designs:</h2>
                <div className="car-selector">
                  <button
                    className="arrow-btn"
                    onClick={() => setVehicleIndex(i => (i - 1 + VEHICLES.length) % VEHICLES.length)}
                  >
                    ←
                  </button>
                  <div className="car-preview" style={{ color: carColor }}>
                    <div className="car-name">{currentVehicle.name}</div>
                    <pre className="car-art">
                      {currentVehicle.art.join('\n')}
                    </pre>
                  </div>
                  <button
                    className="arrow-btn"
                    onClick={() => setVehicleIndex(i => (i + 1) % VEHICLES.length)}
                  >
                    →
                  </button>
                </div>

                <div className="color-selection">
                  <span>Car Color:</span>
                  <div className="color-options">
                    {CAR_COLORS.map((c, i) => (
                      <button
                        key={c.name}
                        className={`color-btn ${i === colorIndex ? 'selected' : ''}`}
                        style={{ backgroundColor: c.color }}
                        onClick={() => setColorIndex(i)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="settings-panel">
                <h2>Settings:</h2>
                <div className="settings-content">
                  <p><strong>How to play:</strong></p>
                  <p>Arrow keys to move</p>
                  <p>Keys 0-9 change radio</p>
                  <p>-/+ adjust volume</p>
                  <div className="radio-toggle">
                    <button className={`radio-btn ${radioOn ? 'on' : ''}`} onClick={toggleRadio}>
                      {radioOn ? '📻 Radio ON' : '📻 Radio OFF'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="car-name-input">
              <button className="random-btn" onClick={generateRandomName}>🎲</button>
              <label>
                Car Name:
                <input
                  type="text"
                  value={carName}
                  onChange={e => setCarName(e.target.value)}
                  maxLength={16}
                />
              </label>
            </div>

            <button className="start-btn" onClick={startGame}>
              Start
            </button>
          </div>

          <div className="road-pattern right">{renderRoadPattern()}</div>
        </div>
      </div>
    )
  }

  // Game screen (playing or game over)
  return (
    <div className="app">
      <div className="radio-bar">
        <button className={`radio-btn-small ${radioOn ? 'on' : ''}`} onClick={toggleRadio}>
          📻
        </button>
        <span className="radio-info">
          {radioOn ? `CH${radioChannel}: ${songInfo.name}` : 'Radio OFF'}
        </span>
        <span className="radio-volume">
          VOL: {Math.round(radioVolume * 100)}%
        </span>
        <span className="radio-hint">[0-9] [-/+]</span>
      </div>
      <header className="title-bar">
        <div className="tires-indicator">
          Tires: {tiresLeft}
        </div>
        <h1>{carName || 'Angry Man in a Car'}</h1>
        <div className="hit-counter">Hits: {hitCount}</div>
      </header>
      <main className="content">
        <div className="game-container">
          <div className="road">
            {renderRoad()}
          </div>

          {isGameOver && (
            <div className="game-over-overlay">
              <div className="game-over-box">
                <h2>GAME OVER</h2>
                <p>You hit {hitCount} people!</p>
                <button className="restart-btn" onClick={goToStart}>
                  Start Again
                </button>
              </div>
            </div>
          )}

          {!isGameOver && (
            <div className="controls-hint">
              <span className="key">↑</span> <span className="key">↓</span> <span className="key">←</span> <span className="key">→</span> to move
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
