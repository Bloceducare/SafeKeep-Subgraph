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
import { Token, User, Inheritor, Allocation } from "../generated/schema"

export function handleEthAllocated(event: EthAllocated): void {}

export function handleEthDeposited(event: EthDeposited): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleclaimedTokens(event: claimedTokens): void {}

export function handleinheritorsAdded(event: inheritorsAdded): void {
  let id = event.params.newInheritors.toHex()
  let inheritor = Inheritor.load(id)
  if(inheritor == null ){
    inheritor = new Inheritor(id)
  }
  inheritor.inheritor = event.params.newInheritors
  inheritor.save()
}

export function handleinheritorsRemoved(event: inheritorsRemoved): void {
  let id = event.params.inheritors.toHex()
  let inheritor = Inheritor.load(id)
  if(inheritor){
    inheritor.inheritor = event.params.inheritors
    inheritor.save()
  }
}

export function handletokenAllocated(event: tokenAllocated): void {
  let id =event.params.inheritors.toHex()
  let allocation = Allocation.load(id)
  if(allocation == null){
    allocation = new Allocation(id)
  }
  allocation.amount = event.params.amounts
  allocation.inheritor = event.params.inheritors
  allocation.token = event.params.token
  allocation.save()
}

export function handletokensDeposited(event: tokensDeposited): void {}

export function handlevaultCreated(event: vaultCreated): void {}
