import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Docs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      minH="100vh"
      bg="#0a0a0f"
      color="#e5e7eb"
      position="relative"
      overflow="hidden"
    >
      {/* Header cu buton de back */}
      <Box
        position="sticky"
        top={0}
        zIndex={100}
        bg="rgba(10, 10, 15, 0.95)"
        backdropFilter="blur(16px)"
        borderBottom="1px solid rgba(139, 92, 246, 0.2)"
        px={4}
        py={3}
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={3}>
            <IconButton
              aria-label="Back"
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "rgba(139,92,246,0.1)" }}
              onClick={() => navigate(-1)}
              size="md"
            />
            <VStack spacing={0} align="start">
              <Heading size="sm" color="white" fontWeight="600">
                Documentation
              </Heading>
              <Text fontSize="10px" color="gray.500" fontFamily="mono">
                Agent GM Protocol · ERC-8004
              </Text>
            </VStack>
          </HStack>
          <Button
            as="a"
            href="https://docs.gm-agent.xyz"
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            colorScheme="purple"
            variant="outline"
            borderColor="rgba(139,92,246,0.3)"
            _hover={{ bg: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.6)" }}
            rightIcon={<ExternalLinkIcon boxSize={3} />}
            fontSize="xs"
          >
            Open in Browser
          </Button>
        </Flex>
      </Box>

      {/* Conținutul principal - Iframe cu docs */}
      <Box h="calc(100vh - 70px)" w="100%" position="relative">
        {loading ? (
          <Flex
            align="center"
            justify="center"
            h="100%"
            direction="column"
            gap={4}
          >
            <Spinner
              thickness="3px"
              speed="0.65s"
              emptyColor="rgba(139,92,246,0.1)"
              color="#8b5cf6"
              size="xl"
            />
            <Text color="gray.500" fontSize="sm" fontFamily="mono">
              Loading documentation...
            </Text>
          </Flex>
        ) : error ? (
          <Flex
            align="center"
            justify="center"
            h="100%"
            direction="column"
            gap={4}
            px={6}
            textAlign="center"
          >
            <Text fontSize="48px">⚠️</Text>
            <Heading size="md" color="gray.300">
              Unable to load documentation
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Please try opening in your browser
            </Text>
            <Button
              as="a"
              href="https://docs.gm-agent.xyz"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="purple"
              size="md"
              mt={2}
            >
              Open Documentation
            </Button>
          </Flex>
        ) : (
          <iframe
            src="https://docs.gm-agent.xyz"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: 0,
              background: "#0a0a0f",
            }}
            title="Agent GM Protocol Documentation"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            loading="lazy"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </Box>
    </Box>
  );
}
