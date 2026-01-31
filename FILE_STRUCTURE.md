# Complete File Structure

## Overview

This document provides the complete directory structure for the CRM Manager project, following monorepo architecture with Domain-Driven Design principles.

---

## Root Structure

```
crm-manager/
├── apps/
│   ├── frontend/              # React application
│   └── backend/               # NestJS application
├── packages/                  # Shared packages (future)
│   ├── shared-types/          # TypeScript types shared between apps
│   └── ui-components/         # Reusable UI components (future)
├── docs/                      # Documentation
│   ├── adr/                   # Architecture Decision Records
│   ├── api/                   # API documentation
│   └── guides/                # User/developer guides
├── scripts/                   # Build and deployment scripts
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production configuration
├── docker-stack.yml           # Docker Swarm stack
├── .env.example               # Environment variables template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── README.md
├── PROJECT_PROPOSAL.md
├── TECHNICAL_DECISIONS.md
├── ARCHITECTURE.md
└── FILE_STRUCTURE.md          # This file
```

---

## Frontend Structure (`apps/frontend/`)

```
apps/frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── assets/                       # Static assets (images, fonts)
│   │   ├── images/
│   │   └── fonts/
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (other shadcn components)
│   │   ├── layout/                   # Layout components
│   │   │   ├── AppLayout.tsx         # Main app layout
│   │   │   ├── AuthLayout.tsx        # Auth pages layout
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── Header.tsx            # Top header bar
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx         # Mobile navigation
│   │   └── common/                   # Shared components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── SearchBar.tsx
│   │       ├── Pagination.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── NotificationToast.tsx
│   ├── features/                     # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   └── ResetPasswordForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useLogout.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   ├── contacts/
│   │   │   ├── components/
│   │   │   │   ├── ContactList.tsx
│   │   │   │   ├── ContactCard.tsx
│   │   │   │   ├── ContactForm.tsx
│   │   │   │   ├── ContactDetails.tsx
│   │   │   │   ├── ContactFilters.tsx
│   │   │   │   ├── ContactSearchBar.tsx
│   │   │   │   ├── ContactImportModal.tsx
│   │   │   │   └── ContactExportButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useContacts.ts
│   │   │   │   ├── useContact.ts
│   │   │   │   ├── useCreateContact.ts
│   │   │   │   ├── useUpdateContact.ts
│   │   │   │   └── useDeleteContact.ts
│   │   │   ├── pages/
│   │   │   │   ├── ContactsPage.tsx
│   │   │   │   ├── ContactDetailPage.tsx
│   │   │   │   └── ContactCreatePage.tsx
│   │   │   ├── services/
│   │   │   │   └── contactService.ts
│   │   │   └── types/
│   │   │       └── contact.types.ts
│   │   ├── conversations/
│   │   │   ├── components/
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ConversationItem.tsx
│   │   │   │   ├── ConversationDetails.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageItem.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   ├── MediaPreview.tsx
│   │   │   │   ├── EmojiPicker.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── ConversationFilters.tsx
│   │   │   │   ├── AssignmentDropdown.tsx
│   │   │   │   └── StatusBadge.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useConversations.ts
│   │   │   │   ├── useConversation.ts
│   │   │   │   ├── useMessages.ts
│   │   │   │   ├── useSendMessage.ts
│   │   │   │   ├── useTypingIndicator.ts
│   │   │   │   └── useMarkAsRead.ts
│   │   │   ├── pages/
│   │   │   │   ├── ConversationsPage.tsx  # Main inbox
│   │   │   │   └── ConversationPage.tsx   # Single conversation
│   │   │   ├── services/
│   │   │   │   ├── conversationService.ts
│   │   │   │   └── messageService.ts
│   │   │   └── types/
│   │   │       ├── conversation.types.ts
│   │   │       └── message.types.ts
│   │   ├── deals/
│   │   │   ├── components/
│   │   │   │   ├── DealBoard.tsx          # Kanban board
│   │   │   │   ├── DealColumn.tsx
│   │   │   │   ├── DealCard.tsx
│   │   │   │   ├── DealForm.tsx
│   │   │   │   ├── DealDetails.tsx
│   │   │   │   ├── DealTimeline.tsx
│   │   │   │   ├── DealActivities.tsx
│   │   │   │   ├── AddActivityModal.tsx
│   │   │   │   ├── DealFilters.tsx
│   │   │   │   ├── DealMetrics.tsx
│   │   │   │   └── WonLostModal.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDeals.ts
│   │   │   │   ├── useDeal.ts
│   │   │   │   ├── useCreateDeal.ts
│   │   │   │   ├── useUpdateDeal.ts
│   │   │   │   ├── useDealActivities.ts
│   │   │   │   └── useDragDrop.ts
│   │   │   ├── pages/
│   │   │   │   ├── DealsPage.tsx
│   │   │   │   ├── DealDetailPage.tsx
│   │   │   │   └── PipelinesPage.tsx
│   │   │   ├── services/
│   │   │   │   ├── dealService.ts
│   │   │   │   └── pipelineService.ts
│   │   │   └── types/
│   │   │       ├── deal.types.ts
│   │   │       └── pipeline.types.ts
│   │   ├── integrations/
│   │   │   ├── components/
│   │   │   │   ├── IntegrationList.tsx
│   │   │   │   ├── IntegrationCard.tsx
│   │   │   │   ├── IntegrationSetupModal.tsx
│   │   │   │   ├── WhatsAppSetup.tsx
│   │   │   │   ├── TelegramSetup.tsx
│   │   │   │   ├── DiscordSetup.tsx
│   │   │   │   ├── SlackSetup.tsx
│   │   │   │   ├── TrelloSetup.tsx
│   │   │   │   ├── MercadoPagoSetup.tsx
│   │   │   │   ├── StripeSetup.tsx
│   │   │   │   └── TestConnectionButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useIntegrations.ts
│   │   │   │   ├── useCreateIntegration.ts
│   │   │   │   └── useTestIntegration.ts
│   │   │   ├── pages/
│   │   │   │   ├── IntegrationsPage.tsx
│   │   │   │   └── IntegrationDetailPage.tsx
│   │   │   ├── services/
│   │   │   │   └── integrationService.ts
│   │   │   └── types/
│   │   │       └── integration.types.ts
│   │   ├── payments/
│   │   │   ├── components/
│   │   │   │   ├── PaymentList.tsx
│   │   │   │   ├── PaymentCard.tsx
│   │   │   │   ├── CreatePaymentModal.tsx
│   │   │   │   ├── PaymentLinkDisplay.tsx
│   │   │   │   ├── PaymentStatusBadge.tsx
│   │   │   │   └── RefundButton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePayments.ts
│   │   │   │   ├── useCreatePayment.ts
│   │   │   │   └── useRefundPayment.ts
│   │   │   ├── pages/
│   │   │   │   ├── PaymentsPage.tsx
│   │   │   │   └── PaymentDetailPage.tsx
│   │   │   ├── services/
│   │   │   │   └── paymentService.ts
│   │   │   └── types/
│   │   │       └── payment.types.ts
│   │   ├── analytics/                # Future feature
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── ChartWidget.tsx
│   │   │   │   └── ReportBuilder.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAnalytics.ts
│   │   │   ├── pages/
│   │   │   │   └── AnalyticsPage.tsx
│   │   │   └── services/
│   │   │       └── analyticsService.ts
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── ProfileSettings.tsx
│   │       │   ├── OrganizationSettings.tsx
│   │       │   ├── UserManagement.tsx
│   │       │   ├── BillingSettings.tsx
│   │       │   ├── NotificationSettings.tsx
│   │       │   └── SecuritySettings.tsx
│   │       ├── hooks/
│   │       │   ├── useProfile.ts
│   │       │   ├── useOrganization.ts
│   │       │   └── useUsers.ts
│   │       ├── pages/
│   │       │   └── SettingsPage.tsx
│   │       └── services/
│   │           ├── settingsService.ts
│   │           └── userService.ts
│   ├── hooks/                        # Global hooks
│   │   ├── useWebSocket.ts           # WebSocket connection
│   │   ├── useNotifications.ts       # Notification system
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts          # Responsive hooks
│   │   ├── useClickOutside.ts
│   │   └── useInfiniteScroll.ts
│   ├── lib/                          # Utilities and configs
│   │   ├── api/
│   │   │   ├── axios.ts              # Axios instance
│   │   │   ├── apiClient.ts          # API client wrapper
│   │   │   ├── queryClient.ts        # React Query config
│   │   │   └── endpoints.ts          # API endpoints constants
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Class name utility (clsx + twMerge)
│   │   │   ├── format.ts             # Date, number formatting
│   │   │   ├── validation.ts         # Common validators
│   │   │   ├── storage.ts            # LocalStorage helpers
│   │   │   └── constants.ts          # App constants
│   │   ├── websocket/
│   │   │   ├── socketClient.ts       # Socket.io client
│   │   │   └── socketEvents.ts       # Event type definitions
│   │   └── zod/
│   │       └── schemas.ts            # Shared Zod schemas
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts              # Auth state
│   │   ├── uiStore.ts                # UI state (modals, sidebars)
│   │   ├── notificationStore.ts      # Notifications queue
│   │   └── conversationStore.ts      # Active conversation state
│   ├── styles/
│   │   ├── globals.css               # Global styles + Tailwind directives
│   │   └── themes.css                # Theme variables
│   ├── types/                        # Global TypeScript types
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── models.types.ts
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   ├── router.tsx                    # React Router configuration
│   └── vite-env.d.ts
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── Dockerfile
└── .dockerignore
```

---

## Backend Structure (`apps/backend/`)

```
apps/backend/
├── src/
│   ├── modules/                      # Domain modules (DDD bounded contexts)
│   │   ├── contacts/
│   │   │   ├── domain/               # Domain layer
│   │   │   │   ├── entities/
│   │   │   │   │   ├── contact.entity.ts
│   │   │   │   │   ├── organization.entity.ts
│   │   │   │   │   └── tag.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── email.vo.ts
│   │   │   │   │   ├── phone.vo.ts
│   │   │   │   │   └── address.vo.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── contact-created.event.ts
│   │   │   │   │   └── contact-updated.event.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── contact-repository.interface.ts
│   │   │   ├── application/          # Application layer
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-contact.use-case.ts
│   │   │   │   │   ├── update-contact.use-case.ts
│   │   │   │   │   ├── delete-contact.use-case.ts
│   │   │   │   │   ├── get-contact.use-case.ts
│   │   │   │   │   ├── list-contacts.use-case.ts
│   │   │   │   │   └── search-contacts.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-contact.dto.ts
│   │   │   │   │   ├── update-contact.dto.ts
│   │   │   │   │   ├── contact-response.dto.ts
│   │   │   │   │   └── contact-query.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── contact-application.service.ts
│   │   │   ├── infrastructure/       # Infrastructure layer
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── contact.repository.ts
│   │   │   │   │   ├── organization.repository.ts
│   │   │   │   │   └── mappers/
│   │   │   │   │       └── contact.mapper.ts
│   │   │   │   └── adapters/
│   │   │   │       └── contact-search.adapter.ts
│   │   │   ├── presentation/         # Presentation layer
│   │   │   │   ├── controllers/
│   │   │   │   │   └── contacts.controller.ts
│   │   │   │   └── guards/
│   │   │   │       └── contact-ownership.guard.ts
│   │   │   ├── contacts.module.ts
│   │   │   └── tests/
│   │   │       ├── unit/
│   │   │       │   ├── create-contact.use-case.spec.ts
│   │   │       │   └── contact.entity.spec.ts
│   │   │       └── integration/
│   │   │           └── contacts.controller.spec.ts
│   │   ├── conversations/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── conversation.entity.ts
│   │   │   │   │   ├── message.entity.ts
│   │   │   │   │   └── participant.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── message-content.vo.ts
│   │   │   │   │   └── conversation-status.vo.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── message-received.event.ts
│   │   │   │   │   ├── message-sent.event.ts
│   │   │   │   │   └── conversation-assigned.event.ts
│   │   │   │   └── interfaces/
│   │   │   │       ├── conversation-repository.interface.ts
│   │   │   │       └── message-repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-conversation.use-case.ts
│   │   │   │   │   ├── send-message.use-case.ts
│   │   │   │   │   ├── receive-message.use-case.ts
│   │   │   │   │   ├── assign-conversation.use-case.ts
│   │   │   │   │   ├── close-conversation.use-case.ts
│   │   │   │   │   └── mark-as-read.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-conversation.dto.ts
│   │   │   │   │   ├── send-message.dto.ts
│   │   │   │   │   ├── conversation-response.dto.ts
│   │   │   │   │   └── message-response.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── conversation-application.service.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── conversation.repository.ts
│   │   │   │   │   ├── message.repository.ts
│   │   │   │   │   └── mappers/
│   │   │   │   │       ├── conversation.mapper.ts
│   │   │   │   │       └── message.mapper.ts
│   │   │   │   └── adapters/
│   │   │   │       └── message-search.adapter.ts
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── conversations.controller.ts
│   │   │   │   │   └── messages.controller.ts
│   │   │   │   └── gateways/
│   │   │   │       └── conversations.gateway.ts  # WebSocket
│   │   │   ├── conversations.module.ts
│   │   │   └── tests/
│   │   ├── integrations/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── integration.entity.ts
│   │   │   │   │   ├── channel.entity.ts
│   │   │   │   │   └── webhook-log.entity.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── channel-strategy.interface.ts
│   │   │   │   │   └── webhook-handler.interface.ts
│   │   │   │   └── events/
│   │   │   │       └── webhook-received.event.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-integration.use-case.ts
│   │   │   │   │   ├── process-webhook.use-case.ts
│   │   │   │   │   └── send-channel-message.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-integration.dto.ts
│   │   │   │   │   ├── webhook-payload.dto.ts
│   │   │   │   │   └── send-message.dto.ts
│   │   │   │   └── services/
│   │   │   │       ├── integration-application.service.ts
│   │   │   │       └── channel-strategy-factory.service.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── integration.repository.ts
│   │   │   │   │   └── webhook-log.repository.ts
│   │   │   │   ├── strategies/           # Strategy Pattern
│   │   │   │   │   ├── whatsapp/
│   │   │   │   │   │   ├── whatsapp.strategy.ts
│   │   │   │   │   │   ├── whatsapp-client.ts
│   │   │   │   │   │   ├── whatsapp-webhook-parser.ts
│   │   │   │   │   │   └── whatsapp.types.ts
│   │   │   │   │   ├── telegram/
│   │   │   │   │   │   ├── telegram.strategy.ts
│   │   │   │   │   │   ├── telegram-client.ts
│   │   │   │   │   │   └── telegram.types.ts
│   │   │   │   │   ├── discord/
│   │   │   │   │   │   ├── discord.strategy.ts
│   │   │   │   │   │   ├── discord-client.ts
│   │   │   │   │   │   └── discord.types.ts
│   │   │   │   │   ├── slack/
│   │   │   │   │   │   ├── slack.strategy.ts
│   │   │   │   │   │   ├── slack-client.ts
│   │   │   │   │   │   └── slack.types.ts
│   │   │   │   │   └── trello/
│   │   │   │   │       ├── trello.strategy.ts
│   │   │   │   │       ├── trello-client.ts
│   │   │   │   │       └── trello.types.ts
│   │   │   │   └── adapters/
│   │   │   │       └── encryption.adapter.ts
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── integrations.controller.ts
│   │   │   │   │   └── webhooks.controller.ts  # All webhook endpoints
│   │   │   │   └── guards/
│   │   │   │       └── webhook-signature.guard.ts
│   │   │   ├── integrations.module.ts
│   │   │   └── tests/
│   │   ├── deals/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── deal.entity.ts
│   │   │   │   │   ├── pipeline.entity.ts
│   │   │   │   │   ├── stage.entity.ts
│   │   │   │   │   └── activity.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── money.vo.ts
│   │   │   │   │   └── deal-status.vo.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── deal-created.event.ts
│   │   │   │   │   ├── deal-stage-changed.event.ts
│   │   │   │   │   ├── deal-won.event.ts
│   │   │   │   │   └── deal-lost.event.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── deal-repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-deal.use-case.ts
│   │   │   │   │   ├── update-deal.use-case.ts
│   │   │   │   │   ├── move-deal-stage.use-case.ts
│   │   │   │   │   ├── win-deal.use-case.ts
│   │   │   │   │   ├── lose-deal.use-case.ts
│   │   │   │   │   └── add-activity.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-deal.dto.ts
│   │   │   │   │   ├── update-deal.dto.ts
│   │   │   │   │   ├── deal-response.dto.ts
│   │   │   │   │   └── activity.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── deal-application.service.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/
│   │   │   │       ├── deal.repository.ts
│   │   │   │       ├── pipeline.repository.ts
│   │   │   │       └── mappers/
│   │   │   │           └── deal.mapper.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       ├── deals.controller.ts
│   │   │   │       └── pipelines.controller.ts
│   │   │   ├── deals.module.ts
│   │   │   └── tests/
│   │   ├── payments/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── payment.entity.ts
│   │   │   │   │   ├── transaction.entity.ts
│   │   │   │   │   └── payment-link.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── payment-status.vo.ts
│   │   │   │   │   └── payment-method.vo.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── payment-created.event.ts
│   │   │   │   │   ├── payment-confirmed.event.ts
│   │   │   │   │   └── payment-failed.event.ts
│   │   │   │   └── interfaces/
│   │   │   │       ├── payment-repository.interface.ts
│   │   │   │       └── payment-gateway.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-payment-link.use-case.ts
│   │   │   │   │   ├── process-payment-webhook.use-case.ts
│   │   │   │   │   └── refund-payment.use-case.ts
│   │   │   │   ├── dtos/
│   │   │   │   │   ├── create-payment.dto.ts
│   │   │   │   │   ├── payment-response.dto.ts
│   │   │   │   │   └── webhook-payload.dto.ts
│   │   │   │   └── services/
│   │   │   │       └── payment-application.service.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   └── payment.repository.ts
│   │   │   │   └── gateways/
│   │   │   │       ├── mercadopago/
│   │   │   │       │   ├── mercadopago.gateway.ts
│   │   │   │       │   ├── mercadopago-client.ts
│   │   │   │       │   └── mercadopago.types.ts
│   │   │   │       └── stripe/
│   │   │   │           ├── stripe.gateway.ts
│   │   │   │           ├── stripe-client.ts
│   │   │   │           └── stripe.types.ts
│   │   │   ├── presentation/
│   │   │   │   └── controllers/
│   │   │   │       └── payments.controller.ts
│   │   │   ├── payments.module.ts
│   │   │   └── tests/
│   │   └── auth/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   ├── user.entity.ts
│   │       │   │   ├── role.entity.ts
│   │       │   │   └── permission.entity.ts
│   │       │   ├── value-objects/
│   │       │   │   └── password.vo.ts
│   │       │   ├── events/
│   │       │   │   ├── user-registered.event.ts
│   │       │   │   └── user-logged-in.event.ts
│   │       │   └── interfaces/
│   │       │       └── user-repository.interface.ts
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   │   ├── register.use-case.ts
│   │       │   │   ├── login.use-case.ts
│   │       │   │   ├── refresh-token.use-case.ts
│   │       │   │   ├── logout.use-case.ts
│   │       │   │   ├── forgot-password.use-case.ts
│   │       │   │   └── reset-password.use-case.ts
│   │       │   ├── dtos/
│   │       │   │   ├── register.dto.ts
│   │       │   │   ├── login.dto.ts
│   │       │   │   ├── auth-response.dto.ts
│   │       │   │   └── user-response.dto.ts
│   │       │   └── services/
│   │       │       ├── auth-application.service.ts
│   │       │       ├── token.service.ts
│   │       │       └── password-hash.service.ts
│   │       ├── infrastructure/
│   │       │   ├── persistence/
│   │       │   │   └── user.repository.ts
│   │       │   └── strategies/
│   │       │       ├── jwt.strategy.ts
│   │       │       ├── local.strategy.ts
│   │       │       └── google-oauth.strategy.ts  # Phase 2
│   │       ├── presentation/
│   │       │   ├── controllers/
│   │       │   │   └── auth.controller.ts
│   │       │   └── guards/
│   │       │       ├── jwt-auth.guard.ts
│   │       │       ├── roles.guard.ts
│   │       │       └── permission.guard.ts
│   │       ├── auth.module.ts
│   │       └── tests/
│   ├── shared/                       # Shared kernel (DDD)
│   │   ├── domain/
│   │   │   ├── base-entity.ts
│   │   │   ├── domain-event.ts
│   │   │   ├── aggregate-root.ts
│   │   │   └── value-object.ts
│   │   ├── interfaces/
│   │   │   ├── repository.interface.ts
│   │   │   ├── use-case.interface.ts
│   │   │   └── mapper.interface.ts
│   │   ├── exceptions/
│   │   │   ├── domain.exception.ts
│   │   │   ├── not-found.exception.ts
│   │   │   ├── validation.exception.ts
│   │   │   └── unauthorized.exception.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── current-organization.decorator.ts
│   │   │   ├── require-permission.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── types/
│   │       ├── common.types.ts
│   │       └── pagination.types.ts
│   ├── database/
│   │   ├── drizzle/
│   │   │   ├── migrations/           # Generated migrations
│   │   │   │   ├── 0000_initial.sql
│   │   │   │   ├── 0001_add_deals.sql
│   │   │   │   └── meta/
│   │   │   ├── schemas/              # Drizzle table definitions
│   │   │   │   ├── organizations.schema.ts
│   │   │   │   ├── users.schema.ts
│   │   │   │   ├── contacts.schema.ts
│   │   │   │   ├── conversations.schema.ts
│   │   │   │   ├── messages.schema.ts
│   │   │   │   ├── deals.schema.ts
│   │   │   │   ├── pipelines.schema.ts
│   │   │   │   ├── payments.schema.ts
│   │   │   │   ├── integrations.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── drizzle.config.ts
│   │   │   └── seed.ts               # Seed data for development
│   │   └── database.module.ts
│   ├── queues/                       # Bull MQ processors
│   │   ├── processors/
│   │   │   ├── webhook.processor.ts
│   │   │   ├── email.processor.ts
│   │   │   ├── notification.processor.ts
│   │   │   ├── cleanup.processor.ts
│   │   │   └── data-retention.processor.ts
│   │   ├── jobs/
│   │   │   ├── send-email.job.ts
│   │   │   ├── send-notification.job.ts
│   │   │   └── cleanup-messages.job.ts
│   │   └── queues.module.ts
│   ├── config/                       # Configuration
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── cors.config.ts
│   │   └── rate-limit.config.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── app.module.ts                 # Root module
│   └── main.ts                       # Bootstrap
├── test/                             # E2E tests
│   ├── auth.e2e-spec.ts
│   ├── contacts.e2e-spec.ts
│   ├── conversations.e2e-spec.ts
│   ├── deals.e2e-spec.ts
│   ├── integrations.e2e-spec.ts
│   ├── payments.e2e-spec.ts
│   └── jest-e2e.json
├── .env.development
├── .env.test
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
└── .dockerignore
```

---

## Infrastructure Files

### Docker Configuration

```
docker-compose.yml              # Development environment
docker-compose.prod.yml         # Production configuration
docker-stack.yml                # Docker Swarm stack

# Nginx/Traefik configuration
nginx/
├── nginx.conf
├── conf.d/
│   ├── api.conf
│   └── ssl.conf
└── certs/                      # SSL certificates

traefik/
├── traefik.yml
└── dynamic/
    └── middlewares.yml
```

### CI/CD Configuration

```
.github/
├── workflows/
│   ├── ci-cd.yml              # Main CI/CD pipeline
│   ├── frontend-test.yml      # Frontend tests
│   ├── backend-test.yml       # Backend tests
│   ├── docker-build.yml       # Docker image build
│   └── deploy.yml             # Deployment
└── dependabot.yml             # Automated dependency updates
```

### Scripts

```
scripts/
├── build.sh                   # Build all apps
├── deploy.sh                  # Deploy to production
├── backup.sh                  # Database backup
├── restore.sh                 # Database restore
├── migrate.sh                 # Run migrations
├── seed.sh                    # Seed database
├── setup-dev.sh               # Setup development environment
├── setup-secrets.sh           # Setup Docker secrets
└── load-test.sh               # Run load tests
```

---

## Documentation Structure

```
docs/
├── adr/                       # Architecture Decision Records
│   ├── 0001-use-nestjs.md
│   ├── 0002-use-drizzle-orm.md
│   ├── 0003-multi-tenant-architecture.md
│   ├── 0004-whatsapp-cloud-api.md
│   ├── 0005-websocket-redis-adapter.md
│   └── template.md
├── api/                       # API documentation
│   ├── rest-api.md
│   ├── websocket-events.md
│   ├── webhooks.md
│   └── postman/
│       └── CRM-Manager.postman_collection.json
├── guides/
│   ├── getting-started.md
│   ├── development-setup.md
│   ├── deployment.md
│   ├── contributing.md
│   └── troubleshooting.md
├── architecture/
│   ├── overview.md
│   ├── database-schema.md
│   ├── domain-model.md
│   └── integration-patterns.md
└── user-manual/
    ├── setup-whatsapp.md
    ├── setup-telegram.md
    ├── managing-contacts.md
    ├── using-conversations.md
    └── sales-pipeline.md
```

---

## Environment Variables Template

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crm_db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_SECRET=
WHATSAPP_VERIFY_TOKEN=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

# Discord
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=

# Trello
TRELLO_API_KEY=
TRELLO_API_TOKEN=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (SendGrid/AWS SES)
EMAIL_FROM=noreply@crm-manager.com
SENDGRID_API_KEY=

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Monitoring
SENTRY_DSN=
PROMETHEUS_ENABLED=false

# Feature Flags
ENABLE_GOOGLE_SSO=false
ENABLE_ANALYTICS=false
```

---

## Git Structure

```
.gitignore                     # Git ignore rules
.gitattributes                 # Git attributes

# Ignored directories (from .gitignore)
node_modules/
dist/
build/
.env
.env.local
.env.production
*.log
coverage/
.DS_Store
postgres-data/
redis-data/
```

---

## Package.json Structure

### Root package.json (Monorepo)

```json
{
  "name": "crm-manager",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/frontend", "apps/backend", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\"",
    "build": "npm run build -w frontend && npm run build -w backend",
    "test": "npm run test -w frontend && npm run test -w backend",
    "lint": "npm run lint -w frontend && npm run lint -w backend",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "docker:dev": "docker-compose up",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "migrate": "npm run migrate -w backend",
    "seed": "npm run seed -w backend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "prettier": "^3.2.5"
  }
}
```

---

This file structure provides a complete, scalable, and maintainable foundation for the CRM Manager project, following industry best practices and Domain-Driven Design principles.
