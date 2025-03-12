"use client"

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Text,
  Checkbox,
  CheckboxGroup,
  Stack,
  useToast,
} from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, createUser, updateUser as updateUserAPI, deleteUser as deleteUserAPI, getRoles } from "@/lib/api"

const UsersPage = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const toast = useToast()

  const queryClient = useQueryClient()

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  })

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  })

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onClose()
      toast({
        title: "User created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: updateUserAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onClose()
      toast({
        title: "User updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast({
        title: "User deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const handleCreateUser = async () => {
    await createUserMutation.mutateAsync({ name, email, roles: selectedRoles })
  }

  const handleUpdateUser = async () => {
    if (selectedUserId) {
      await updateUserMutation.mutateAsync({
        id: selectedUserId,
        name,
        email,
        roles: selectedRoles,
      })
    }
  }

  const handleDeleteUser = async (id: string) => {
    await deleteUserMutation.mutateAsync(id)
  }

  const handleEditUser = (user: any) => {
    setIsEditMode(true)
    setSelectedUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    setSelectedUser(user)
    const userRoles = selectedUser?.roles?.length > 0 ? selectedUser.roles : []
    setSelectedRoles(userRoles.map((role: any) => role.id))
    onOpen()
  }

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name)
      setEmail(selectedUser.email)
      const userRoles = selectedUser?.roles?.length > 0 ? selectedUser.roles : []
      setSelectedRoles(userRoles.map((role: any) => role.id))
    }
  }, [selectedUser])

  const handleOpenModal = () => {
    setIsEditMode(false)
    setSelectedUserId(null)
    setName("")
    setEmail("")
    setSelectedRoles([])
    setSelectedUser(null)
    onOpen()
  }

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading as="h1" size="xl">
          Users
        </Heading>
        <Button colorScheme="blue" onClick={handleOpenModal}>
          Create User
        </Button>
      </Flex>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Roles</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  Loading...
                </Td>
              </Tr>
            ) : isError ? (
              <Tr>
                <Td colSpan={4} textAlign="center">
                  Error loading users.
                </Td>
              </Tr>
            ) : (
              users?.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.roles?.map((role: any) => role.name).join(", ") || "No Roles"}</Td>
                  <Td>
                    <Button size="sm" colorScheme="yellow" onClick={() => handleEditUser(user)}>
                      Edit
                    </Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDeleteUser(user.id)} ml={2}>
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditMode ? "Edit User" : "Create User"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Roles</FormLabel>
              {roles ? (
                <CheckboxGroup
                  value={selectedRoles}
                  onChange={(values) => {
                    setSelectedRoles(values)
                  }}
                >
                  <Stack spacing={[1, 5]} direction={["column", "row"]}>
                    {roles.map((role) => (
                      <Checkbox key={role.id} value={role.id}>
                        {role.name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              ) : (
                <Text>Loading roles...</Text>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={isEditMode ? handleUpdateUser : handleCreateUser}
              isLoading={createUserMutation.isLoading || updateUserMutation.isLoading}
            >
              {isEditMode ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default UsersPage

