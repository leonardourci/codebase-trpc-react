import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function App() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-md mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Frontend Foundation</CardTitle>
                        <CardDescription>
                            React 19 + Tailwind CSS + shadcn/ui components
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input placeholder="Enter your email" type="email" />
                        <div className="flex gap-2">
                            <Button variant="default">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Ghost</Button>
                            <Button variant="destructive" size="sm">Destructive</Button>
                            <Button variant="link" size="sm">Link</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default App