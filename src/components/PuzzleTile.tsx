// src/components/PuzzleTile.tsx
import { Box, Image, Text } from "@chakra-ui/react";

interface PuzzleTileProps {
  index: number;
  isUnlocked: boolean;
  imageSrc: string;
}

export default function PuzzleTile({ index, isUnlocked, imageSrc }: PuzzleTileProps) {
  return (
    <Box
      position="relative"
      aspectRatio={1}
      rounded="3xl"
      overflow="hidden"
      boxShadow={isUnlocked ? "0 0 35px rgba(168, 85, 247, 0.6)" : "0 0 20px rgba(168, 85, 247, 0.25)"}
      transition="all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
      _hover={{
        transform: "scale(1.06)",
        boxShadow: isUnlocked ? "0 0 55px rgba(168, 85, 247, 0.85)" : "0 0 35px rgba(168, 85, 247, 0.5)",
      }}
      sx={{
        animation: isUnlocked ? "tilePop 0.6s ease-out" : "none",
        "@keyframes tilePop": { "0%": { transform: "scale(0.85)" }, "100%": { transform: "scale(1)" } },
      }}
    >
      {/* Piece number */}
      <Box
        position="absolute"
        top={3}
        left={3}
        bg={isUnlocked ? "emerald.500" : "gray.700"}
        color="white"
        px={3}
        py={1}
        rounded="full"
        fontSize="sm"
        fontWeight="bold"
        zIndex={4}
        boxShadow="0 0 15px rgba(0,0,0,0.6)"
      >
        {index.toString().padStart(2, "0")}
      </Box>

      <Image
        src={imageSrc}
        alt={`Piece ${index}`}
        w="100%"
        h="100%"
        objectFit="cover"
        transition="filter 0.7s ease-out"
        filter={isUnlocked ? "none" : "blur(8px) grayscale(80%) brightness(0.75)"}
        loading="lazy"
      />

      {/* Locked overlay */}
      {!isUnlocked && (
        <Box
          position="absolute"
          inset={0}
          bg="blackAlpha.800"
          backdropFilter="blur(4px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          gap={2}
          zIndex={2}
        >
          <Text fontSize="6xl" color="whiteAlpha.900">🔒</Text>
          <Text fontSize="sm" color="whiteAlpha.700" fontWeight="medium">Locked – Boost to unlock</Text>
        </Box>
      )}

      {/* Neon green checkmark */}
      {isUnlocked && (
        <Box
          position="absolute"
          top={3}
          right={3}
          bg="#22c55e"
          color="white"
          w="44px"
          h="44px"
          rounded="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xl"
          fontWeight="black"
          boxShadow="0 0 25px #22c55e"
          zIndex={3}
          animation="checkBounce 0.5s ease-out"
          sx={{
            "@keyframes checkBounce": {
              "0%": { transform: "scale(0.6) rotate(-20deg)" },
              "80%": { transform: "scale(1.15)" },
              "100%": { transform: "scale(1) rotate(0)" },
            },
          }}
        >
          ✓
        </Box>
      )}
    </Box>
  );
}
