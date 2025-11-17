"use client"

import { useState, useEffect, useCallback } from "react"
import { Pickaxe, Trophy, Flame } from "lucide-react"

type BlockType = "grass" | "dirt" | "stone" | "wood" | "diamond" | "lava" | "empty"

interface Block {
  type: BlockType
  x: number
  y: number
}

interface Player {
  x: number
  y: number
}

const GRID_SIZE = 12
const BLOCK_SIZE = 48

const blockColors: Record<BlockType, string> = {
  grass: "bg-gradient-to-b from-green-500 to-green-600",
  dirt: "bg-gradient-to-b from-amber-700 to-amber-800",
  stone: "bg-gradient-to-b from-gray-500 to-gray-600",
  wood: "bg-gradient-to-b from-amber-600 to-amber-700",
  diamond: "bg-gradient-to-b from-cyan-400 to-blue-500",
  lava: "bg-gradient-to-b from-orange-500 to-red-600 animate-pulse",
  empty: "bg-sky-400/30"
}

export default function MiniCraftGame() {
  const [phase, setPhase] = useState<1 | 2>(1)
  const [grid, setGrid] = useState<Block[][]>([])
  const [player, setPlayer] = useState<Player>({ x: 5, y: 2 })
  const [inventory, setInventory] = useState({ wood: 0, stone: 0, diamond: 0 })
  const [gameWon, setGameWon] = useState(false)

  // Gerar grid da fase 1
  const generatePhase1Grid = useCallback(() => {
    const newGrid: Block[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Block[] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: BlockType = "empty"
        
        if (y > 8) {
          type = "stone"
        } else if (y > 6) {
          type = "dirt"
        } else if (y > 4) {
          if (Math.random() > 0.7) type = "wood"
          else type = "grass"
        }
        
        row.push({ type, x, y })
      }
      newGrid.push(row)
    }
    return newGrid
  }, [])

  // Gerar grid da fase 2
  const generatePhase2Grid = useCallback(() => {
    const newGrid: Block[][] = []
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Block[] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: BlockType = "empty"
        
        if (y > 9) {
          type = Math.random() > 0.8 ? "diamond" : "stone"
        } else if (y > 7) {
          type = Math.random() > 0.9 ? "lava" : "stone"
        } else if (y > 5) {
          type = "dirt"
        } else if (y > 3) {
          type = Math.random() > 0.6 ? "wood" : "grass"
        }
        
        row.push({ type, x, y })
      }
      newGrid.push(row)
    }
    return newGrid
  }, [])

  // Inicializar jogo
  useEffect(() => {
    if (phase === 1) {
      setGrid(generatePhase1Grid())
      setPlayer({ x: 5, y: 2 })
    } else {
      setGrid(generatePhase2Grid())
      setPlayer({ x: 5, y: 1 })
    }
  }, [phase, generatePhase1Grid, generatePhase2Grid])

  // Controles do teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameWon) return

      setPlayer(prev => {
        let newX = prev.x
        let newY = prev.y

        switch(e.key) {
          case "ArrowLeft":
          case "a":
            newX = Math.max(0, prev.x - 1)
            break
          case "ArrowRight":
          case "d":
            newX = Math.min(GRID_SIZE - 1, prev.x + 1)
            break
          case "ArrowUp":
          case "w":
            newY = Math.max(0, prev.y - 1)
            break
          case "ArrowDown":
          case "s":
            newY = Math.min(GRID_SIZE - 1, prev.y + 1)
            break
          case " ":
            mineBlock(prev.x, prev.y)
            return prev
        }

        // Verificar se pode mover (não pode atravessar blocos sólidos)
        const targetBlock = grid[newY]?.[newX]
        if (targetBlock && targetBlock.type !== "empty" && targetBlock.type !== "lava") {
          return prev
        }

        // Verificar lava (game over temporário)
        if (targetBlock?.type === "lava") {
          alert("Você caiu na lava! Reiniciando fase...")
          if (phase === 1) {
            setGrid(generatePhase1Grid())
          } else {
            setGrid(generatePhase2Grid())
          }
          return { x: 5, y: phase === 1 ? 2 : 1 }
        }

        return { x: newX, y: newY }
      })
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [grid, gameWon, phase, generatePhase1Grid, generatePhase2Grid])

  // Minerar bloco
  const mineBlock = (x: number, y: number) => {
    // Minerar blocos adjacentes
    const directions = [
      { dx: 0, dy: 1 },  // baixo
      { dx: 0, dy: -1 }, // cima
      { dx: 1, dy: 0 },  // direita
      { dx: -1, dy: 0 }  // esquerda
    ]

    directions.forEach(({ dx, dy }) => {
      const targetX = x + dx
      const targetY = y + dy

      if (targetX >= 0 && targetX < GRID_SIZE && targetY >= 0 && targetY < GRID_SIZE) {
        const block = grid[targetY][targetX]
        
        if (block.type !== "empty" && block.type !== "lava") {
          // Adicionar ao inventário
          if (block.type === "wood") {
            setInventory(prev => ({ ...prev, wood: prev.wood + 1 }))
          } else if (block.type === "stone") {
            setInventory(prev => ({ ...prev, stone: prev.stone + 1 }))
          } else if (block.type === "diamond") {
            setInventory(prev => ({ ...prev, diamond: prev.diamond + 1 }))
          }

          // Remover bloco
          setGrid(prevGrid => {
            const newGrid = [...prevGrid]
            newGrid[targetY] = [...newGrid[targetY]]
            newGrid[targetY][targetX] = { ...block, type: "empty" }
            return newGrid
          })
        }
      }
    })
  }

  // Verificar condições de vitória
  useEffect(() => {
    if (phase === 1 && inventory.wood >= 5 && inventory.stone >= 3) {
      setTimeout(() => {
        if (confirm("Fase 1 completa! Avançar para Fase 2?")) {
          setPhase(2)
          setInventory({ wood: 0, stone: 0, diamond: 0 })
        }
      }, 100)
    }

    if (phase === 2 && inventory.diamond >= 3) {
      setGameWon(true)
    }
  }, [inventory, phase])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-500 p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
            MiniCraft
          </h1>
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
        <p className="text-white font-semibold text-lg">
          Fase {phase} {phase === 1 ? "- Colete 5 Madeiras e 3 Pedras" : "- Colete 3 Diamantes"}
        </p>
      </div>

      {/* Inventário */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 shadow-2xl">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-b from-amber-600 to-amber-700 rounded border-2 border-amber-900"></div>
            <span className="font-bold">Madeira: {inventory.wood}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-b from-gray-500 to-gray-600 rounded border-2 border-gray-800"></div>
            <span className="font-bold">Pedra: {inventory.stone}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded border-2 border-blue-700"></div>
            <span className="font-bold">Diamante: {inventory.diamond}</span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-2xl">
        <div 
          className="grid gap-0.5 bg-black/20 p-1 rounded-xl"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${BLOCK_SIZE}px)`,
            width: `${GRID_SIZE * BLOCK_SIZE + 8}px`
          }}
        >
          {grid.map((row, y) =>
            row.map((block, x) => (
              <div
                key={`${x}-${y}`}
                className={`relative ${blockColors[block.type]} border border-black/20 transition-all duration-100`}
                style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}
              >
                {/* Player */}
                {player.x === x && player.y === y && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm border-2 border-blue-800 shadow-lg animate-bounce">
                      <div className="w-6 h-2 bg-amber-300 mx-auto mt-2 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Block texture */}
                {block.type !== "empty" && (
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`
                    }}></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Pickaxe className="w-5 h-5" />
          <p className="font-bold">Controles:</p>
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">WASD</span> ou <span className="font-semibold">Setas</span> para mover
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">ESPAÇO</span> para minerar blocos ao redor
        </p>
      </div>

      {/* Modal de Vitória */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl shadow-2xl text-center max-w-md animate-bounce">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-white" />
            <h2 className="text-4xl font-bold text-white mb-4">Parabéns!</h2>
            <p className="text-xl text-white mb-6">
              Você completou as 2 fases do MiniCraft!
            </p>
            <button
              onClick={() => {
                setPhase(1)
                setInventory({ wood: 0, stone: 0, diamond: 0 })
                setGameWon(false)
              }}
              className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
