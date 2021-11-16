import { BigInt } from "@graphprotocol/graph-ts"
import {
  SafeKeep,
  ClaimedEth,
  EthAllocated,
  EthDeposited,
  OwnershipTransferred,
  claimedTokens,
  inheritorsAdded,
  inheritorsRemoved,
  tokenAllocated,
  tokensDeposited,
  vaultCreated
} from "../generated/SafeKeep/SafeKeep"
import { Token, User, Inheritor } from "../generated/schema"

export function handleEthAllocated(event: EthAllocated): void {}

export function handleEthDeposited(event: EthDeposited): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleclaimedTokens(event: claimedTokens): void {}

export function handleinheritorsAdded(event: inheritorsAdded): void {
  let id = Inheritor.load(event.params.newInheritors.toHex())
  if(id == null ){
    let inheritor = new Inheritor(event.params.newInheritors.toHex())
    inheritor.inheritor = event.params.newInheritors
  }
 

}

export function handleinheritorsRemoved(event: inheritorsRemoved): void {}

export function handletokenAllocated(event: tokenAllocated): void {}

export function handletokensDeposited(event: tokensDeposited): void {
  
}

export function handlevaultCreated(event: vaultCreated): void {}
