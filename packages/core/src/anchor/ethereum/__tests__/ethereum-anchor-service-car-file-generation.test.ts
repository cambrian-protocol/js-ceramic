import { jest } from '@jest/globals'
import { CID } from 'multiformats/cid'
import { StreamID } from '@ceramicnetwork/streamid'
import { whenSubscriptionDone } from '../../../__tests__/when-subscription-done.util.js'
import * as uint8arrays from 'uint8arrays'

const FAKE_STREAM_ID = StreamID.fromString(
  'k2t6wzhkhabz4iozbwukqnyan8lli6e2edigwn03nhrq8nbvzym3wzn56bykht'
)
const FAKE_TIP_CID = CID.parse('bagcqcerat536epypmyelrvtcnti3xwjxivnurmtkoy3igjphzbnbsf3agjta')
const FAKE_TIP_BLOCK = uint8arrays.fromString(
  'omdwYXlsb2FkWCQBcRIgSX7d3YYXmhLKun6do2K6Dm5HklU29s5KJY87lRcHuVpqc2lnbmF0dXJlc4GiaXByb3RlY3RlZFjMeyJhbGciOiJFZERTQSIsImNhcCI6ImlwZnM6Ly9iYWZ5cmVpZ3dvbHFmNGRnMmV2ZTZwaDVjbjJobzJrdDd3aHEyYWRhYzZhcTN6cmJydDVueWlhYTJobSIsImtpZCI6ImRpZDprZXk6ejZNa3AzWlVBRGRVM1hvdHlIdjNldHVTWmE0ZVlENGtIWDRidzRCaHF3ZjlaSFBXI3o2TWtwM1pVQURkVTNYb3R5SHYzZXR1U1phNGVZRDRrSFg0Ync0Qmhxd2Y5WkhQVyJ9aXNpZ25hdHVyZVhAlxEJfHU7uNDyvSH9BBF7lXvIFbqgt5wELoZlf6Dyv/cYk05VsVcnpc+Oy1+vExSXP1Eh3T9ZnYY2uHztOwcJCg',
  'base64'
)
const FAKE_TIP_LINK_CID = CID.parse('bafyreicjp3o53bqxtijmvot6twrwfoqonzdzevjw63heujmphokrob5zli')
const FAKE_TIP_LINK_BLOCK = uint8arrays.fromString(
  'o2JpZNgqWCUAAXESIKeaGTlNzSt16Bw1ZiVycvdSWAzHPD38BJMIK1oKmG9BZGRhdGGBo2JvcGdyZXBsYWNlZHBhdGhlL25hbWVldmFsdWVwQXJ0dXIgV2Rvd2lhcnNraWRwcmV22CpYJgABhQESIDfOU7kb8M0QYTAEKczNCZJsVyoIePzP4pLMSH1sMs9Q',
  'base64'
)
const FAKE_GENESIS_CID = CID.parse('bafyreifhtimtstonfn26qhbvmysxe4xxkjmazrz4hx6ajeyifnnavgdpie')
const FAKE_GENESIS_BLOCK = uint8arrays.fromString(
  'omRkYXRh9mZoZWFkZXKiZW1vZGVsWCjOAQIBhQESIDLbfW98Iv6DOOQpsnJAmr+9Ptj2CKjW3Zi/rtTNW5Sfa2NvbnRyb2xsZXJzgXg7ZGlkOnBraDplaXAxNTU6MToweDkyNmVlYjE5MmMxOGI3YmU2MDdhN2UxMGM4ZTdhN2U4ZDlmNzA3NDI',
  'base64'
)
const FAKE_TIP_CACAO_CID = CID.parse('bafyreigwolqf4dg2eve6ph5cn2ho2kt7whq2adac6aq3zrbrt5nyiaa2hm')
const FAKE_TIP_CACAO_BLOCK = uint8arrays.fromString(
  'o2JpZNgqWCUAAXESIKeaGTlNzSt16Bw1ZiVycvdSWAzHPD38BJMIK1oKmG9BZGRhdGGBo2JvcGdyZXBsYWNlZHBhdGhlL25hbWVldmFsdWVwQXJ0dXIgV2Rvd2lhcnNraWRwcmV22CpYJgABhQESIDfOU7kb8M0QYTAEKczNCZJsVyoIePzP4pLMSH1sMs9Q',
  'base64'
)

const casProcessingResponse = {
  status: 'PROCESSING',
  message: `Success; nonce: ${Math.random()}`,
}

const nowISOString = new Date().toISOString()

function getCacaoCidFromCommit(commit: any): CID | undefined {
  // this is more or less copied code from @ceramicnetwork/common, but for some reason,
  // if I import @ceramicnetwork/common here, everything blows up
  const decodedProtectedHeader = JSON.parse(
    uint8arrays.toString(uint8arrays.fromString(commit.signatures[0].protected, 'base64url'))
  ) as Record<string, any>
  if (decodedProtectedHeader.cap) {
    const capIPFSUri = decodedProtectedHeader.cap
    return CID.parse(capIPFSUri.replace('ipfs://', ''))
  }
  return undefined
}

expect.extend({
  toBeACorrectCARFile(received) {
    if (received.roots.length !== 1) {
      return {
        pass: false,
        message: () => {
          return `Expected the CAR file to have just one root, but it has ${received.roots.length}`
        },
      }
    }

    const rootCid = received.roots[0]
    const rootBlock = received.get(rootCid)
    try {
      expect(rootBlock).toEqual({
        timestamp: nowISOString,
        streamId: FAKE_STREAM_ID.bytes,
        tip: FAKE_TIP_CID.bytes,
      })
    } catch (e) {
      return {
        pass: false,
        message: () => {
          return `Wrong root block in the CAR file: ${e.message}`
        },
      }
    }

    try {
      const genesisCid = StreamID.fromBytes(rootBlock.streamId).cid
      expect(genesisCid).toEqual(FAKE_GENESIS_CID)
      expect(received.blocks.get(genesisCid).payload).toEqual(FAKE_GENESIS_BLOCK)
    } catch (e) {
      return {
        pass: false,
        message: () => {
          return `Wrong genesis block in the CAR file: ${e.message}`
        },
      }
    }

    let tip: CID = undefined
    try {
      tip = CID.decode(rootBlock.tip)
      expect(tip).toEqual(FAKE_TIP_CID)
      expect(received.blocks.get(tip).payload).toEqual(FAKE_TIP_BLOCK)
    } catch (e) {
      return {
        pass: false,
        message: () => {
          return `Wrong tip block in the CAR file: ${e.message}`
        },
      }
    }

    let tipLinkCid: CID = undefined
    try {
      tipLinkCid = received.get(tip).link
      expect(tipLinkCid).toEqual(FAKE_TIP_LINK_CID)
      expect(received.blocks.get(tipLinkCid).payload).toEqual(FAKE_TIP_LINK_BLOCK)
    } catch (e) {
      return {
        pass: false,
        message: () => {
          return `Wrong tip link block in the CAR file: ${e.message}`
        },
      }
    }

    try {
      const tipCacaoCid = getCacaoCidFromCommit(received.get(tip))
      expect(tipCacaoCid).toEqual(FAKE_TIP_CACAO_CID)
      expect(received.blocks.get(tipCacaoCid).payload).toEqual(FAKE_TIP_CACAO_BLOCK)
    } catch (e) {
      return {
        pass: false,
        message: () => {
          return `Wrong cacao block in the CAR file: ${e.message}`
        },
      }
    }

    return {
      pass: true,
      message: () => {
        return 'Expected ${received} is the right CAR file for our mocked data'
      },
    }
  },
})

jest.unstable_mockModule('cross-fetch', () => {
  const fetchFunc = jest.fn(async (url: string, opts: any = {}) => ({
    ok: true,
    json: async () => {
      return casProcessingResponse
    },
  }))
  return {
    default: fetchFunc,
  }
})

jest.setTimeout(20000)

let ipfs: any
let ceramic: any

afterAll(async () => {
  ceramic && (await ceramic.close())
  ipfs && (await ipfs.stop())
})

test('car files are generated correctly for anchor requests', async () => {
  const common = await import('@ceramicnetwork/common')
  const eas = await import('../ethereum-anchor-service.js')
  const { createIPFS } = await import('@ceramicnetwork/ipfs-daemon')
  const { createCeramic } = await import('../../../__tests__/create-ceramic.js')
  const { createDidAnchorServiceAuth } = await import(
    '../../../__tests__/create-did-anchor-service-auth.js'
  )
  const loggerProvider = new common.LoggerProvider()
  const diagnosticsLogger = loggerProvider.getDiagnosticsLogger()
  const url = 'http://example.com'

  ipfs = await createIPFS()
  ceramic = await createCeramic(ipfs, { streamCacheLimit: 1, anchorOnRequest: true })
  const { auth } = createDidAnchorServiceAuth(url, ceramic, diagnosticsLogger)
  const anchorService = new eas.AuthenticatedEthereumAnchorService(
    auth,
    url,
    diagnosticsLogger,
    100
  )
  const makeAnchorRequestSpy = jest.spyOn(anchorService as any, '_makeAnchorRequest')

  let lastResponse: any
  const subscription = anchorService
    .requestAnchor({
      streamId: FAKE_STREAM_ID,
      timestampISO: nowISOString,
      genesisCid: FAKE_GENESIS_CID,
      genesisBlock: FAKE_GENESIS_BLOCK,
      tip: FAKE_TIP_CID,
      tipBlock: FAKE_TIP_BLOCK,
      tipLinkCid: FAKE_TIP_LINK_CID,
      tipLinkBlock: FAKE_TIP_LINK_BLOCK,
      tipCacaoCid: FAKE_TIP_CACAO_CID,
      tipCacaoBlock: FAKE_TIP_CACAO_BLOCK,
    })
    .subscribe((response) => {
      if (response.status === common.AnchorStatus.PROCESSING) {
        lastResponse = response
        subscription.unsubscribe()
      }
    })
  await whenSubscriptionDone(subscription)
  expect(lastResponse.message).toEqual(casProcessingResponse.message)
  expect(makeAnchorRequestSpy).toHaveBeenCalledTimes(1)
  expect(makeAnchorRequestSpy.mock.calls[0][2])
    // @ts-ignore
    .toBeACorrectCARFile()
  expect(makeAnchorRequestSpy).toHaveBeenCalledWith(FAKE_STREAM_ID, FAKE_TIP_CID, expect.anything())
})
