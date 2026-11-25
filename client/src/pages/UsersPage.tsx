import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchUsers, type User } from '@/lib/users'

type UsersState =
  | { kind: 'loading' }
  | { kind: 'ok'; users: User[] }
  | { kind: 'error' }

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export default function UsersPage() {
  const [state, setState] = useState<UsersState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchUsers(controller.signal)
      .then((users) => setState({ kind: 'ok', users }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ kind: 'error' })
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setState({ kind: 'loading' })
    setAttempt((n) => n + 1)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="mt-6">
        {state.kind === 'loading' && <p className="text-sm text-muted-foreground">Loading users…</p>}
        {state.kind === 'error' && (
          <div className="flex flex-col items-start gap-4">
            <Alert variant="destructive">
              <AlertDescription>Could not load users.</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
        {state.kind === 'ok' && <UsersTable users={state.users} />}
      </div>
    </main>
  )
}

function UsersTable({ users }: { users: User[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user.role === 'ADMIN' ? 'Admin' : 'Agent'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Deactivated'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{dateFormat.format(new Date(user.createdAt))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
