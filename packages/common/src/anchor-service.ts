import type { CID } from 'multiformats/cid'
import type { Observable } from 'rxjs'
import type { AnchorProof, AnchorStatus } from './stream.js'
import type { CeramicApi } from './ceramic-api.js'
import type { StreamID } from '@ceramicnetwork/streamid'
import { CAR } from 'cartonne'

export interface AnchorServicePending {
  readonly status: AnchorStatus.PENDING
  readonly streamId: StreamID
  readonly cid: CID
  readonly message: string
}

export interface AnchorServiceProcessing {
  readonly status: AnchorStatus.PROCESSING
  readonly streamId: StreamID
  readonly cid: CID
  readonly message: string
}

export interface AnchorServiceAnchored {
  readonly status: AnchorStatus.ANCHORED
  readonly streamId: StreamID
  readonly cid: CID
  readonly message: string
  readonly anchorCommit: CID
}

export interface AnchorServiceFailed {
  readonly status: AnchorStatus.FAILED
  readonly streamId: StreamID
  readonly cid: CID
  readonly message: string
}

/**
 * Describes anchor service response
 */
export type AnchorServiceResponse =
  | AnchorServicePending
  | AnchorServiceProcessing
  | AnchorServiceAnchored
  | AnchorServiceFailed

/**
 * Describes anchoring service behavior
 */
export interface AnchorService {
  /**
   * Performs whatever initialization work is required by the specific anchor service implementation
   */
  init(): Promise<void>

  /**
   * Set Ceramic API instance
   *
   * @param ceramic - Ceramic API used for various purposes
   */
  ceramic: CeramicApi

  /**
   * URL of the connected anchor service
   */
  url: string

  /**
   * Request anchor commit on blockchain
   * @param streamId - Stream ID
   * @param tip - CID tip
   */
  requestAnchor(carFile: CAR): Observable<AnchorServiceResponse>

  /**
   * Start polling the anchor service to learn of the results of an existing anchor request for the
   * given tip for the given stream.
   * @param streamId - Stream ID
   * @param tip - Tip CID of the stream
   */
  pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse>

  /**
   * @returns An array of the CAIP-2 chain IDs of the blockchains that are supported by this
   * anchor service.
   */
  getSupportedChains(): Promise<Array<string>>
}

/**
 * Describes behavior for validation anchor commit inclusion on chain
 */
export interface AnchorValidator {
  /**
   * Performs whatever initialization work is required to validate commits anchored on the
   * configured blockchain.
   */
  init(chainId: string | null): Promise<void>

  /**
   * Verifies that the given anchor proof refers to a valid ethereum transaction that actually
   * includes the expected merkle root in the transaction data.  Throws if the transaction doesn't
   * contain the expected data.
   * @param anchorProof Proof of blockchain inclusion
   * @returns The ethereum block timestamp that includes the anchor transaction from the anchorProof
   */
  validateChainInclusion(anchorProof: AnchorProof): Promise<number>
}
