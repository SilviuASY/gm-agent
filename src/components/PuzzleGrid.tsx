// src/components/PuzzleGrid.tsx
import { Grid, VStack, Text } from "@chakra-ui/react";
import PuzzleTile from "./PuzzleTile";

interface PuzzleGridProps {
  piecesUnlocked: number;
  images: string[];
}

export default function PuzzleGrid({ piecesUnlocked, images }: PuzzleGridProps) {
  return (
    <VStack spacing={6} align="center" w="full">
      <Text
        fontSize={{ base: "2xl", lg: "3xl" }}
        fontWeight="bold"
        bgGradient="linear(to-r, #a855f7, #7e22ce)"
        bgClip="text"
      >
        Pulse Puzzle – 9 Boosts to Complete
      </Text>

      <Grid
        templateColumns="repeat(3, 1fr)"
        gap={{ base: 4, md: 6 }}
        w={{ base: "92%", md: "520px", lg: "580px" }}
        maxW="580px"
        mx="auto"
      >
        {images.map((src, idx) => (
          <PuzzleTile
            key={idx}
            index={idx + 1}
            isUnlocked={idx + 1 <= piecesUnlocked}
            imageSrc={src}
          />
        ))}
      </Grid>
    </VStack>
  );
}
