import { BigInt } from "@graphprotocol/graph-ts"
import { ByteArray } from '@graphprotocol/graph-ts'
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
import { Token, User, Inheritor, Allocation, Vault, ClamiedToken } from "../generated/schema"

// export function handleEthAllocated(event: EthAllocated): void {}

// export function handleEthDeposited(event: EthDeposited): void {
//   let id = event.params.tokens.toHex()
//   let deposit = Token.load(id)
//   if(deposit){
//     deposit.amount = event.params.amounts
//     deposit.save()
//   }
// }

// export function handleOwnershipTransferred(event: OwnershipTransferred): void {

// }

export function handleclaimedTokens(event: claimedTokens): void {
    let id = event.params.inheritor.toHex()
    let claimed = ClamiedToken.load(id)
    if(claimed == null){
      claimed = new ClamiedToken(id)
    }
    claimed.inheritor = event.params.inheritor
    claimed.token = event.params.token
    claimed.amount = event.params.amount
}

export function handleinheritorsAdded(event: inheritorsAdded): void {
  let id = event.params.newInheritors.toHex()
  let inheritor = Inheritor.load(id)
  if(inheritor == null ){
    inheritor = new Inheritor(id)
  }
  inheritor.inheritor = event.params.newInheritors
  inheritor.save()

  let user = User.load(id)
  if(!user){
    user = new User(id)
    user.save()
  }
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

export function handletokensDeposited(event: tokensDeposited): void {
  let id = event.params.tokens.toHex()
  let deposit = Token.load(id)
  if(deposit){
    deposit.token = event.params.tokens
    deposit.amount = event.params.amounts
    deposit.save()
  }
}

export function handlevaultCreated(event: vaultCreated): void {
  let id = event.params.owner.toHex()
  let vaultcreated = Vault.load(id)
  
  if(vaultcreated == null ){
    vaultcreated = new Vault(id) 
    let inheritor = vaultcreated.inheritors
    if(inheritor == null){
      inheritor = []
    }
    vaultcreated.owner = event.params.owner.toHex()
    vaultcreated.backup = event.params.backup
    vaultcreated.StartingAmount = event.params.startingBalance
    vaultcreated.inheritors = inheritor
    vaultcreated.save()
  }
  
}
