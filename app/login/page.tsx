import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { loginOwner, loginContractor } from "./actions"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Parking Manager</h1>
                    <p className="text-gray-500">Monthly Parking Management System</p>
                </div>

                {message && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
                        {message}
                    </div>
                )}

                <Tabs defaultValue="contractor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="contractor">Contractor</TabsTrigger>
                        <TabsTrigger value="owner">Owner</TabsTrigger>
                    </TabsList>

                    <TabsContent value="contractor">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contractor Access</CardTitle>
                                <CardDescription>
                                    Enter your registered name to access your portal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={loginContractor} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" name="name" placeholder="e.g. Tanaka" required />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Access Portal
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="owner">
                        <Card>
                            <CardHeader>
                                <CardTitle>Owner Login</CardTitle>
                                <CardDescription>
                                    Secure login for parking management.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={loginOwner} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="owner@example.com" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Login
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
