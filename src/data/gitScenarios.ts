import { GitState, Commit, Branch, FileChange, Conflict } from '../types';

// Helper for generating standard hex colors for branch visual tags (GitNest-style vibrant neon)
export const BRANCH_COLORS: Record<string, string> = {
  'main': '#22d3ee', // Neon Cyan
  'master': '#22d3ee',
  'dev': '#a78bfa', // Neon Violet
  'feature/auth': '#f472b6', // Neon Pink
  'feature/ui': '#fbbf24', // Yellow Amber
  'bugfix/api': '#f87171', // Red/Coral
  'origin/main': '#34d399', // Emerald
};

const AUTHOR = 'Alex Mercer <alex@nestdev.io>';

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  state: GitState;
}

export const gitScenarios: ScenarioDefinition[] = [
  {
    id: 'merge-conflict',
    title: 'Visual Merge Conflict Resolution',
    subtitle: 'Resolve overlapping lines between "main" and "feature/auth" branches.',
    description: 'Both branches modified index.html and api.ts concurrently. Merging feature/auth into main results in a conflict. Switch to main, or initiate a merge, and resolve the files line-by-line using the visual interface!',
    state: {
      activeBranchName: 'main',
      branches: {
        'main': {
          name: 'main',
          head: 'c4a91b2',
          isRemote: false,
          color: BRANCH_COLORS['main']
        },
        'feature/auth': {
          name: 'feature/auth',
          head: 'e39b7d1',
          isRemote: false,
          color: BRANCH_COLORS['feature/auth']
        },
        'origin/main': {
          name: 'origin/main',
          head: 'a12bcf4',
          isRemote: true,
          color: BRANCH_COLORS['origin/main']
        }
      },
      commits: {
        'a12bcf4': {
          id: 'a12bcf4',
          parents: [],
          message: 'Initial project boilerplate structure',
          author: AUTHOR,
          date: 'May 20, 2026',
          branchName: 'main',
          changes: [
            {
              filename: 'index.html',
              status: 'added',
              originalContent: '',
              modifiedContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>'
            },
            {
              filename: 'api.ts',
              status: 'added',
              originalContent: '',
              modifiedContent: 'export const fetchUser = () => { return null; };'
            }
          ]
        },
        'b319cd8': {
          id: 'b319cd8',
          parents: ['a12bcf4'],
          message: 'Add responsive CSS typography defaults',
          author: AUTHOR,
          date: 'May 21, 2026',
          branchName: 'main',
          changes: [
            {
              filename: 'style.css',
              status: 'added',
              originalContent: '',
              modifiedContent: 'body { font-family: sans-serif; \n background-color: #0c0a09;\n color: #fafaf9; }'
            }
          ]
        },
        'c4a91b2': {
          id: 'c4a91b2',
          parents: ['b319cd8'],
          message: 'main: Implement login endpoint proxy and update root template title',
          author: AUTHOR,
          date: 'May 22, 2026',
          branchName: 'main',
          changes: [
            {
              filename: 'index.html',
              status: 'modified',
              originalContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>',
              modifiedContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Nest Core - Production Site</title>\n</head>\n<body>\n  <header><h1>Nest Core Portal</h1></header>\n  <div id="root"></div>\n</body>\n</html>'
            },
            {
              filename: 'api.ts',
              status: 'modified',
              originalContent: 'export const fetchUser = () => { return null; };',
              modifiedContent: 'export const fetchUser = async (id: string) => {\n  console.log("Routing via master API gateway");\n  const res = await fetch(`/api/users/${id}`);\n  return res.json();\n};'
            }
          ]
        },
        // Diverged branch
        'f92acd5': {
          id: 'f92acd5',
          parents: ['b319cd8'],
          message: 'feature/auth: Scaffold local session state',
          author: AUTHOR,
          date: 'May 21, 2026',
          branchName: 'feature/auth',
          changes: [
            {
              filename: 'auth.ts',
              status: 'added',
              originalContent: '',
              modifiedContent: 'export const getSessionToken = () => localStorage.getItem("token");'
            }
          ]
        },
        'e39b7d1': {
          id: 'e39b7d1',
          parents: ['f92acd5'],
          message: 'feature/auth: Enable JWT verification and update template header',
          author: AUTHOR,
          date: 'May 23, 2026',
          branchName: 'feature/auth',
          changes: [
            {
              filename: 'index.html',
              status: 'modified',
              originalContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>App</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>',
              modifiedContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Enterprise Security Center</title>\n</head>\n<body>\n  <nav id="auth-nav">Login Panel</nav>\n  <div id="root"></div>\n  <footer>Secured by OAuth 2.0</footer>\n</body>\n</html>'
            },
            {
              filename: 'api.ts',
              status: 'modified',
              originalContent: 'export const fetchUser = () => { return null; };',
              modifiedContent: 'export const fetchUser = async (authToken: string) => {\n  console.log("Verifying token via OAuth callback");\n  const res = await fetch("/api/auth/token", {\n    headers: { Authorization: `Bearer ${authToken}` }\n  });\n  return res.ok ? res.json() : null;\n};'
            }
          ]
        }
      },
      tags: {
        'v1.0.0-rc': 'b319cd8'
      },
      stashes: [],
      stagedFiles: [],
      unstagedFiles: [],
      conflicts: {} // Set dynamically when a merge is triggered, or preloaded for quick editing!
    }
  },
  {
    id: 'feature-rebase',
    title: 'Branch Divagation & Rebase',
    subtitle: 'Rebase active "feature/ui" branch onto "dev" to align changes on a single timeline.',
    description: 'You have written three custom visual component commits on "feature/ui" while your teammate merged an API helper on "dev". Use the visual rebase button or run "git rebase dev" in the command line to see commits instantly rehashed and stacked linearly on dev!',
    state: {
      activeBranchName: 'feature/ui',
      branches: {
        'main': {
          name: 'main',
          head: 'aa11aa1',
          isRemote: false,
          color: BRANCH_COLORS['main']
        },
        'dev': {
          name: 'dev',
          head: 'dd22dd2',
          isRemote: false,
          color: BRANCH_COLORS['dev']
        },
        'feature/ui': {
          name: 'feature/ui',
          head: 'ff44ff4',
          isRemote: false,
          color: BRANCH_COLORS['feature/ui']
        }
      },
      commits: {
        'aa11aa1': {
          id: 'aa11aa1',
          parents: [],
          message: 'Release production baseline config',
          author: AUTHOR,
          date: 'May 15, 2026',
          branchName: 'main',
          changes: [{ filename: 'package.json', status: 'modified', originalContent: '', modifiedContent: '{"version": "1.0.0"}' }]
        },
        // dev diverged from main
        'bb11bb1': {
          id: 'bb11bb1',
          parents: ['aa11aa1'],
          message: 'dev: Setup developer portal proxy routers',
          author: AUTHOR,
          date: 'May 16, 2026',
          branchName: 'dev',
          changes: [{ filename: 'server.js', status: 'added', originalContent: '', modifiedContent: 'console.log("Dev Server Initialized");' }]
        },
        'dd22dd2': {
          id: 'dd22dd2',
          parents: ['bb11bb1'],
          message: 'dev: Add automated build telemetry pipeline',
          author: AUTHOR,
          date: 'May 18, 2026',
          branchName: 'dev',
          changes: [{ filename: 'ci.yml', status: 'added', originalContent: '', modifiedContent: 'on: push' }]
        },
        // feature UI diverged from dev at bb11bb1
        'ff22ff2': {
          id: 'ff22ff2',
          parents: ['bb11bb1'],
          message: 'feature/ui: Add Glassmorphism navigation panel',
          author: AUTHOR,
          date: 'May 17, 2026',
          branchName: 'feature/ui',
          changes: [{ filename: 'Navbar.tsx', status: 'added', originalContent: '', modifiedContent: 'export const Navbar = () => <nav className="backdrop-blur" />' }]
        },
        'ff33ff3': {
          id: 'ff33ff3',
          parents: ['ff22ff2'],
          message: 'feature/ui: Implement Sidebar collapser state',
          author: AUTHOR,
          date: 'May 18, 2026',
          branchName: 'feature/ui',
          changes: [{ filename: 'Sidebar.tsx', status: 'added', originalContent: '', modifiedContent: 'export const Sidebar = () => { const [collapsed, setCollapsed] = useState(false); }' }]
        },
        'ff44ff4': {
          id: 'ff44ff4',
          parents: ['ff33ff3'],
          message: 'feature/ui: Styled responsive grid of custom tool cards',
          author: AUTHOR,
          date: 'May 19, 2026',
          branchName: 'feature/ui',
          changes: [{ filename: 'Grid.tsx', status: 'added', originalContent: '', modifiedContent: 'export const Grid = () => <div className="grid grid-cols-1 md:grid-cols-3" />' }]
        }
      },
      tags: {
        'v0.9.0-beta': 'aa11aa1'
      },
      stashes: [],
      stagedFiles: [],
      unstagedFiles: [],
      conflicts: {}
    }
  },
  {
    id: 'local-working-directory',
    title: 'Local Changes & Stash Simulation',
    subtitle: 'Manage local modifications, stagings, commits, and stashes.',
    description: 'You have local uncommitted changes sitting in your directory that aren\'t staged yet. Stage them, formulate a smart message, and commit, or use "git stash" to temporarily shelve them and work on hotfixes!',
    state: {
      activeBranchName: 'main',
      branches: {
        'main': {
          name: 'main',
          head: 'fa238cc',
          isRemote: false,
          color: BRANCH_COLORS['main']
        },
        'bugfix/api': {
          name: 'bugfix/api',
          head: 'ca154ef',
          isRemote: false,
          color: BRANCH_COLORS['bugfix/api']
        }
      },
      commits: {
        '2e01fac': {
          id: '2e01fac',
          parents: [],
          message: 'Init master base repository',
          author: AUTHOR,
          date: 'May 24, 2026',
          branchName: 'main',
          changes: []
        },
        'fa238cc': {
          id: 'fa238cc',
          parents: ['2e01fac'],
          message: 'main: Configure core routers for client modules',
          author: AUTHOR,
          date: 'May 25, 2026',
          branchName: 'main',
          changes: [
            {
              filename: 'App.tsx',
              status: 'modified',
              originalContent: 'export default function App() { return <div>Empty</div>; }',
              modifiedContent: 'export default function App() {\n  return (\n    <div className="p-8 bg-zinc-950 text-white min-h-screen">\n      <h1>Welcome to GitNest Workspace</h1>\n    </div>\n  );\n}'
            }
          ]
        },
        // Diverging hotfix
        'ca154ef': {
          id: 'ca154ef',
          parents: ['2e01fac'],
          message: 'bugfix/api: Resolve payload truncation error on express body limits',
          author: AUTHOR,
          date: 'May 25, 2026',
          branchName: 'bugfix/api',
          changes: []
        }
      },
      tags: {},
      stashes: [
        {
          id: 'stash@{0}',
          message: 'WIP on App config: draft navbar styling changes',
          changes: [
            {
              filename: 'Navbar.tsx',
              status: 'modified',
              originalContent: 'export const Navbar = () => <nav />',
              modifiedContent: 'export const Navbar = () => <nav className="bg-zinc-900 border-b border-zinc-800 p-4 shrink-0 flex items-center justify-between" />'
            }
          ]
        }
      ],
      stagedFiles: [],
      unstagedFiles: [
        {
          filename: 'App.tsx',
          status: 'modified',
           originalContent: 'export default function App() {\n  return (\n    <div className="p-8 bg-zinc-950 text-white min-h-screen">\n      <h1>Welcome to GitNest Workspace</h1>\n    </div>\n  );\n}',
          modifiedContent: 'export default function App() {\n  return (\n    <div className="p-8 bg-zinc-950 text-white min-h-screen flex flex-col gap-6">\n      <h1 className="text-3xl font-sans tracking-tight">Welcome to GitNest Workspace</h1>\n      <p className="text-zinc-400 font-mono text-sm">Visualizing complex branch hierarchies.</p>\n      <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-black font-semibold transition-all">Initialize Simulation</button>\n    </div>\n  );\n}'
        },
        {
          filename: 'config.json',
          status: 'added',
          originalContent: '',
          modifiedContent: '{\n  "mode": "standalone",\n  "devServer": "http://localhost:3000",\n  "visualGlow": true,\n  "autoStage": false\n}'
        }
      ],
      conflicts: {}
    }
  }
];
