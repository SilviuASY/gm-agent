import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  Text,
  Spinner,
  Icon,
  Button
} from "@chakra-ui/react"

import { FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi"

interface TransactionModalProps {
  isOpen: boolean
  status: 'idle' | 'wallet' | 'pending' | 'success' | 'rejected' | 'failed'
  title: string
  description: string
  onClose: () => void
}

export default function TransactionModal({
  isOpen,
  status,
  title,
  description,
  onClose
}: TransactionModalProps) {

  const getIcon = () => {
    switch (status) {
      case "wallet":
        return <Spinner size="xl" color="purple.400" thickness="3px" />
      case "pending":
        return <Spinner size="xl" color="purple.400" thickness="3px" />
      case "success":
        return <Icon as={FiCheckCircle} boxSize={14} color="green.400" />
      case "rejected":
        return <Icon as={FiXCircle} boxSize={14} color="red.400" />
      case "failed":
        return <Icon as={FiAlertCircle} boxSize={14} color="orange.400" />
      default:
        return <Spinner size="xl" color="purple.400" thickness="3px" />
    }
  }

  const getButton = () => {
    switch (status) {
      case "success":
        return (
          <Button colorScheme="purple" onClick={onClose} borderRadius="full" px={8}>
            Continue
          </Button>
        )
      case "rejected":
        return (
          <Button colorScheme="red" onClick={onClose} borderRadius="full" px={8}>
            Close
          </Button>
        )
      case "failed":
        return (
          <Button colorScheme="orange" onClick={onClose} borderRadius="full" px={8}>
            Try Again
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay backdropFilter="blur(8px)" />

      <ModalContent 
        bg="linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 30, 0.95))"
        backdropFilter="blur(20px)"
        color="white" 
        p={6} 
        borderRadius="2xl"
        border="1px solid rgba(139, 92, 246, 0.3)"
        boxShadow="0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(139,92,246,0.2)"
      >

        <ModalBody>

          <VStack spacing={5}>

            {getIcon()}

            <Text fontSize="lg" fontWeight="bold" bgGradient="linear(135deg, #c084fc, #ec4899)" bgClip="text">
              {title}
            </Text>

            <Text textAlign="center" color="gray.300">
              {description}
            </Text>

            {getButton()}

          </VStack>

        </ModalBody>

      </ModalContent>
    </Modal>
  )
}