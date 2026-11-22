import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function toggle() {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
