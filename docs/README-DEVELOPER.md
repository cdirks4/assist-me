# DeFi Assistant Platform - Developer Guide

## Development Environment Setup

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn
   - Git
   - Code editor (VS Code recommended)

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=
   NEXT_PUBLIC_CHAIN_ID=5003
   NEXT_PUBLIC_CHAIN=mantle-sepolia
   NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
   NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.sepolia.mantle.xyz
   NEXT_PUBLIC_TOKEN_CONTRACT=
   ```

## Project Structure

```
src/
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── config/             # Configuration files
├── constants/          # Contract ABIs and addresses
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── providers/          # Service providers
├── services/           # Core business logic
└── types/              # TypeScript type definitions
```

## Key Design Patterns

1. **Component Architecture**
   - Use "use client" directive for client components
   - Implement proper TypeScript types
   - Follow atomic design principles

2. **State Management**
   - Use React Context for global state
   - Implement custom hooks for reusable logic
   - Maintain clean component state

3. **Service Pattern**
   - Singleton services for core functionality
   - Clear separation of concerns
   - Comprehensive error handling

## Development Guidelines

### 1. Component Development
```typescript
"use client";

interface ComponentProps {
  prop1: string;
  prop2: number;
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Implementation
}
```

### 2. Hook Development
```typescript
export function useCustomHook() {
  const [state, setState] = useState<Type>();
  
  useEffect(() => {
    // Effect implementation
  }, []);

  return { state };
}
```

### 3. Service Development
```typescript
export class CustomService {
  private static instance: CustomService;
  
  static getInstance(): CustomService {
    if (!CustomService.instance) {
      CustomService.instance = new CustomService();
    }
    return CustomService.instance;
  }
}
```

## Testing

1. **Component Testing**
   - Implement unit tests for components
   - Test user interactions
   - Verify state changes

2. **Service Testing**
   - Test core business logic
   - Mock blockchain interactions
   - Verify error handling

## Common Tasks

### 1. Adding a New Page
```typescript
// src/app/new-page/page.tsx
"use client";

export default function NewPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Implementation */}
    </div>
  );
}
```

### 2. Creating a New Component
```typescript
// src/components/NewComponent.tsx
"use client";

interface NewComponentProps {
  // Props definition
}

export function NewComponent({ ...props }: NewComponentProps) {
  // Implementation
}
```

### 3. Implementing a New Service
```typescript
// src/services/newService.ts
export class NewService {
  // Service implementation
}

export const newService = new NewService();
```

## Best Practices

1. **Code Organization**
   - Keep components focused and small
   - Use proper file naming conventions
   - Maintain clear directory structure

2. **Performance**
   - Implement proper caching strategies
   - Optimize component renders
   - Use proper loading states

3. **Error Handling**
   - Implement comprehensive error boundaries
   - Provide user-friendly error messages
   - Log errors appropriately

4. **Security**
   - Validate user inputs
   - Implement proper authentication checks
   - Follow blockchain security best practices

## Deployment

1. **Build Process**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Environment Configuration**
   - Set up production environment variables
   - Configure proper RPC endpoints
   - Set up monitoring

3. **Testing**
   - Run final tests
   - Check for console errors
   - Verify all features

## Troubleshooting

1. **Common Issues**
   - Wallet connection problems
   - Transaction failures
   - State management issues

2. **Debugging Tools**
   - Browser developer tools
   - React Developer Tools
   - Network monitoring

3. **Logging**
   - Implement proper error logging
   - Monitor transaction status
   - Track user interactions

## Resources

1. **Documentation**
   - [Next.js Documentation](https://nextjs.org/docs)
   - [Ethers.js Documentation](https://docs.ethers.org/)
   - [Privy Documentation](https://docs.privy.io/)

2. **Tools**
   - [Mantle Network Explorer](https://explorer.sepolia.mantle.xyz)
   - [Uniswap V3 Documentation](https://docs.uniswap.org/)
   - [Tailwind CSS Documentation](https://tailwindcss.com/docs)
