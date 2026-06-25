import { MockProvider } from './MockProvider'
import { env } from '../config/env'
import { PaymentProvider } from './PaymentProviders'

function createPaymentProvider(): PaymentProvider {
  if (env.PROVIDER === 'nomba') {
    // uncomment on July 1 when NombaProvider is ready
    // const { NombaProvider } = require('./NombaProvider')
    // return new NombaProvider()
    throw new Error('NombaProvider not yet implemented')
  }
  return new MockProvider()
}

export const paymentProvider = createPaymentProvider()