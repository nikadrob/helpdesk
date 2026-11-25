import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usersQuery, type User } from '@/lib/users'

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' })

export default function UsersPage() {
  const { data: users, isPending, isError, isFetching, refetch } = useQuery(usersQuery)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="mt-6">
        {isPending && <p className="text-sm text-muted-foreground">Loading users…</p>}
        {/* Also hides a list loaded earlier, for example when the user is no longer an admin. */}
        {isError && (
          <div className="flex flex-col items-start gap-4">
            <Alert variant="destructive">
              <AlertDescription>Could not load users.</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Trying again…' : 'Try again'}
            </Button>
          </div>
        )}
        {users && !isError && <UsersTable users={users} />}
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
