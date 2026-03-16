export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'starter-plan',
    name: 'Starter',
    description: 'Perfect for getting started with tender management',
    priceInCents: 4900, // $49/month
    features: [
      'Up to 10 tenders per month',
      'AI bid generation (basic)',
      '2 contractor profiles',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'pro-plan',
    name: 'Professional',
    description: 'For active tender bidding and scaling operations',
    priceInCents: 14900, // $149/month
    features: [
      'Unlimited tenders',
      'Advanced AI bid generation',
      'Unlimited contractors',
      'Advanced analytics & reports',
      'Priority support',
      'Custom tender templates',
      'API access',
    ],
  },
  {
    id: 'enterprise-plan',
    name: 'Enterprise',
    description: 'For large teams and complex procurement needs',
    priceInCents: 49900, // $499/month
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced compliance audit trails',
      'Multi-team workspace',
      '24/7 phone support',
      'SLA guarantee',
    ],
  },
]
