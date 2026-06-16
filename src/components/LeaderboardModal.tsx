// src/components/LeaderboardModal.tsx

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; score: number; total_users: number } | null>(null);
  const { address } = useAccount();
  const toast = useToast();

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/leaderboard');
      const data = await response.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/.netlify/functions/leaderboard?userAddress=${address}`);
      const data = await response.json();
      if (data.rank !== undefined) {
        setUserRank(data);
      }
    } catch (error) {
      console.error("Failed to fetch user rank:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(`/.netlify/functions/leaderboard?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (error) {
      toast({ title: "Search failed", description: "Please try again", status: "error", duration: 3000 });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      fetchUserRank();
    }
  }, [isOpen, address]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const displayData = searchResults.length > 0 ? searchResults : leaderboard;

  const getBadgeStyle = (score: number) => {
    if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700" };
    if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0" };
    if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35" };
    if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc" };
    if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80" };
    return { label: "NEW", icon: "✨", color: "#9ca3af" };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent bg="rgba(8,8,20,0.98)" border="1px solid rgba(139,92,246,0.4)" borderRadius="2xl" maxW="800px">
        <ModalCloseButton color="gray.400" />
        
        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            <HStack justify="space-between">
              <HStack spacing={2}>
                <Text fontSize="24px" fontWeight="800" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">🏆 Leaderboard</Text>
                <Badge bg="#c084fc" color="white">Top 50</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">Live • Real-time scores</Text>
            </HStack>

            {address && userRank && (
              <Box bg="rgba(139,92,246,0.1)" borderRadius="xl" p={4} border="1px solid rgba(139,92,246,0.3)">
                <HStack justify="space-between" wrap="wrap" spacing={4}>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Your Rank</Text>
                    {userRank.rank ? (
                      <Badge fontSize="lg" px={3} py={1} borderRadius="full" bgGradient="linear(135deg, #c084fc, #ec4899)" color="white">
                        #{userRank.rank}
                      </Badge>
                    ) : (
                      <Badge fontSize="sm" px={3} py={1} borderRadius="full" bg="gray.600" color="gray.300">
                        Unranked
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Your Score</Text>
                    <Text fontSize="xl" fontWeight="800" color="#c084fc">{userRank.score} pts</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.400">Total Users</Text>
                    <Text fontSize="lg" fontWeight="700" color="#4ade80">{userRank.total_users || 0}</Text>
                  </HStack>
                </HStack>
                {!userRank.rank && userRank.score === 0 && (
                  <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                    💡 Complete an action to appear on the leaderboard!
                  </Text>
                )}
              </Box>
            )}

            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Search by wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="rgba(0,0,0,0.3)"
                border="1px solid rgba(139,92,246,0.3)"
                _hover={{ borderColor: "rgba(139,92,246,0.5)" }}
                _focus={{ borderColor: "#c084fc", boxShadow: "0 0 0 1px #c084fc" }}
                color="white"
                borderRadius="full"
              />
            </InputGroup>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="#c084fc" />
              </Flex>
            ) : displayData.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text fontSize="lg" color="gray.500">No users found</Text>
                <Text fontSize="sm" color="gray.600" mt={2}>Be the first to complete an action!</Text>
              </Box>
            ) : (
              <TableContainer>
                <Table variant="unstyled" size="sm">
                  <Thead>
                    <Tr borderBottom="1px solid rgba(139,92,246,0.2)">
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">RANK</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">WALLET</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono" isNumeric>SCORE</Th>
                      <Th color="gray.500" fontSize="xs" fontWeight="500" fontFamily="mono">BADGE</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayData.map((user, idx) => {
                      const badge = getBadgeStyle(user.score);
                      const isCurrentUser = address && user.address.toLowerCase() === address.toLowerCase();
                      return (
                        <Tr 
                          key={idx} 
                          borderBottom="1px solid rgba(139,92,246,0.1)"
                          bg={isCurrentUser ? "rgba(139,92,246,0.15)" : "transparent"}
                          _hover={{ bg: "rgba(139,92,246,0.08)" }}
                          transition="all 0.2s"
                        >
                          <Td>
                            <Text fontWeight="700" color={user.rank <= 3 ? "#fbbf24" : "gray.400"} fontSize="md">
                              #{user.rank}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Text fontWeight="500" color={isCurrentUser ? "#c084fc" : "white"} fontSize="sm" fontFamily="mono">
                                {user.truncated_address || user.address.slice(0, 6) + '...' + user.address.slice(-4)}
                              </Text>
                              {isCurrentUser && (
                                <Badge bg="#c084fc20" color="#c084fc" fontSize="9px" px={2}>You</Badge>
                              )}
                            </HStack>
                          </Td>
                          <Td isNumeric>
                            <Text fontWeight="700" color="#c084fc" fontSize="md">{user.score}</Text>
                          </Td>
                          <Td>
                            <Badge bg={`${badge.color}20`} color={badge.color} px={2} py={1} borderRadius="full" fontSize="10px" fontWeight="600">
                              {badge.icon} {badge.label}
                            </Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}

            {searchTerm && searchResults.length > 0 && (
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Found {searchResults.length} result(s)
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(139,92,246,0.15)" py={4}>
          <HStack spacing={4} justify="center" w="full">
            <Text fontSize="10px" color="gray.500">🏆 Top 50 users by reputation score</Text>
            <Text fontSize="10px" color="gray.500">🔄 Updates in real-time</Text>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
