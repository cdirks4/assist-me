# DeFi Assistant Platform

An AI-powered DeFi trading companion built on the Mantle Network that helps users interact with decentralized exchanges through natural language commands and provides real-time market insights.

> 🏆 Submitted to Sozu AI Virtual Hack Week 3

**Live Demo**: [https://assist-me-six.vercel.app/](https://assist-me-six.vercel.app/)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Usage](#usage)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Overview

The DeFi Assistant Platform is a web3 application that combines artificial intelligence with decentralized finance to provide an intuitive trading experience. Running on the Mantle Sepolia testnet, it offers features like AI-powered trading, wallet management, and real-time market analysis.

## Features

- **AI-Powered Trading**
  - Natural language processing for trade execution
  - Intelligent market analysis
  - Automated trading suggestions

- **Wallet Management**
  - Secure wallet creation and connection
  - Balance tracking across multiple tokens
  - Easy funds transfer and management
  - MNT/WMNT wrapping and unwrapping

- **Market Analysis**
  - Real-time pool statistics
  - Top liquidity pools tracking
  - Recent trade monitoring
  - Price and volume analytics

- **DeFi Operations**
  - Token swaps through FusionX/Uniswap
  - Liquidity pool interaction
  - Smart contract integration
  - Multi-chain support (Mantle Sepolia, Arbitrum Sepolia)

## Technology Stack

- **Frontend Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Privy
- **Blockchain Integration**: ethers.js
- **State Management**: React Context
- **API Integration**: URQL for GraphQL
- **AI Integration**: Groq

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- A web3 wallet (MetaMask recommended)
- Access to Mantle Sepolia testnet

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd defi-assistant
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_CHAIN=mantle-sepolia
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_BLOCK_EXPLORER=https://explorer.sepolia.mantle.xyz
NEXT_PUBLIC_TOKEN_CONTRACT=your-token-contract
```

## Usage

1. **Connect Wallet**
   - Click "Login" in the navigation bar
   - Choose email or wallet connection method
   - Authorize connection to Mantle Sepolia network

2. **Create AI Agent Wallet**
   - Navigate to the home page
   - Click "Create Wallet" in the Get Started section
   - Fund your wallet with test MNT

3. **Trading**
   - Use the chat interface to execute trades
   - Type natural language commands like:
     - "wrap 0.1 MNT"
     - "show top pools"
     - "check recent trades"

4. **Market Analysis**
   - Visit the Markets page for real-time analytics
   - View top liquidity pools
   - Monitor recent trading activity
   - Track token prices and volumes

## Architecture

The application follows a modular architecture:

- `src/app/*` - Next.js pages and API routes
- `src/components/*` - Reusable React components
- `src/services/*` - Core business logic and blockchain interactions
- `src/hooks/*` - Custom React hooks for data fetching
- `src/context/*` - Global state management
- `src/lib/*` - Utility functions and helpers
- `src/constants/*` - Configuration and contract constants

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
