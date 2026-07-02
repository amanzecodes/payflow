import { PaymentProvider } from './PaymentProviders.js'
import { NombaProvider } from './NombaProvider.js'

function createPaymentProvider(): PaymentProvider {
  
    return new NombaProvider()
  
  // return new MockProvider()
}

export const paymentProvider = createPaymentProvider()