import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Spinner,
  Icon,
  Button,
} from "@chakra-ui/react";

import { FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";

type ModalStatus = "idle" | "wallet" | "pending" | "success" | "rejected" | "failed";

interface TransactionModalProps {
  isOpen: boolean;
  status: ModalStatus;
  title: string;
  description: string;
  onClose: () => void;
  onRetry?: () => void;
}

const statusConfig: Record<ModalStatus, {
  icon: React.ReactNode;
  buttonText: string;
  buttonScheme: string;
  buttonVariant?: "solid" | "outline";
  buttonColor?: string;
}> = {
  idle: {
    icon: <Spinner size="xl" color="purple.400" thickness="3px" />,
    buttonText: "Cancel",
    buttonScheme: "gray",
    buttonVariant: "outline",
    buttonColor: "gray.400",
  },
  wallet: {
    icon: <Spinner size="xl" color="purple.400" thickness="3px" />,
    buttonText: "Cancel",
    buttonScheme: "gray",
    buttonVariant: "outline",
    buttonColor: "gray.400",
  },
  pending: {
    icon: <Spinner size="xl" color="purple.400" thickness="3px" />,
    buttonText: "Cancel",
    buttonScheme: "gray",
    buttonVariant: "outline",
    buttonColor: "gray.400",
  },
  success: {
    icon: <Icon as={FiCheckCircle} boxSize={14} color="green.400" />,
    buttonText: "Continue",
    buttonScheme: "purple",
  },
  rejected: {
    icon: <Icon as={FiXCircle} boxSize={14} color="red.400" />,
    buttonText: "Close",
    buttonScheme: "red",
  },
  failed: {
    icon: <Icon as={FiAlertCircle} boxSize={14} color="orange.400" />,
    buttonText: "Try Again",
    buttonScheme: "orange",
  },
};

export default function TransactionModal({
  isOpen,
  status,
  title,
  description,
  onClose,
  onRetry,
}: TransactionModalProps) {
  const config = statusConfig[status];

  const handleButtonClick = () => {
    if (status === "failed" && onRetry) {
      onRetry();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      closeOnOverlayClick={status !== "pending" && status !== "wallet"}
      closeOnEsc={status !== "pending" && status !== "wallet"}
    >
      <ModalOverlay backdropFilter="blur(10px)" />

      <ModalContent
        bg="linear-gradient(135deg, #1A1A2E 0%, #0F0F1E 100%)"
        backdropFilter="blur(20px)"
        border="1px solid rgba(139, 92, 246, 0.25)"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(139, 92, 246, 0.15)"
        borderRadius="3xl"
        p={8}
        maxW="md"
      >
        <ModalBody p={0}>
          <VStack spacing={6} textAlign="center">
            {/* Icon / Spinner */}
            <div>{config.icon}</div>

            {/* Titlu */}
            <Text
              fontSize="2xl"
              fontWeight="700"
              bgGradient="linear(90deg, #C084FC, #EC4899)"
              bgClip="text"
              letterSpacing="tight"
            >
              {title}
            </Text>

            {/* Descriere */}
            <Text color="gray.300" fontSize="md" lineHeight="1.6" px={4}>
              {description}
            </Text>

            {/* Buton */}
            <Button
              colorScheme={config.buttonScheme}
              variant={config.buttonVariant ?? "solid"}
              size="lg"
              width="full"
              borderRadius="full"
              py={6}
              fontWeight="600"
              onClick={handleButtonClick}
              mt={2}
              {...(config.buttonVariant === "outline" && {
                color: config.buttonColor,
                borderColor: config.buttonColor,
                _hover: {
                  bg: "whiteAlpha.100",
                  borderColor: "gray.300",
                  color: "white",
                },
                _active: {
                  bg: "whiteAlpha.200",
                },
              })}
            >
              {config.buttonText}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}