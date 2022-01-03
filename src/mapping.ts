import { bigInt, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts"

import {
  SafeKeep as SafeKeepContract,
  ClaimedEth as ClaimedEthEvent,
  EthAllocated as EthAllocatedEvent,
  EthDeposited as EthDepositedEvent,
  EthWithdrawn as EthWithdrawnEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  claimedTokens as ClaimedTokensEvent,
  inheritorsAdded as InheritorsAddedEvent,
  inheritorsRemoved as InheritorsRemovedEvent,
  tokenAllocated as TokenAllocatedEvent,
  tokensDeposited as TokensDepositedEvent,
  vaultCreated as VaultCreatedEvent,
  tokensWithdrawn as TokensWithdrawnEvent,
  inheritorsAddedVaultCreated as InheritorsAddedVaultCreatedEvent,
  
  
} from "../generated/SafeKeep/SafeKeep"
import { Token, Inheritor,  Vault } from "../generated/schema"

import {findItemIndex, removeItems,} from './utils'


export function handleinheritorsAddedVaultCreated(event: InheritorsAddedVaultCreatedEvent): void {}

export function handleClaimedEth(event: ClaimedEthEvent): void {
  let vault = Vault.load(event.params.vaultId.toString())

  //Todo -> Reduce Inheritors assets records!
  if(vault){
   let prevAmt = vault.StartingAmount
   let currentAmt = event.params._amount
   vault.StartingAmount = currentAmt.minus(prevAmt)
    vault.save()
  }
}


export function handleEthAllocated(event: EthAllocatedEvent):void{
  let id = event.params.vaultId.toString()
  let inheritors =event.params.inheritors
  let ethAllocations = event.params.amounts
  let vault = Vault.load(id)
  

  if(!vault) return;
  let share = vault.ethShares
  let inheritorsList= vault.inherit

  for (let i = 0; i < inheritors.length; i++) {
    const inheritor = inheritors[i].toHexString();
    const ethAllocated = ethAllocations[i];
    let inheritorsEntity = Inheritor.load(inheritor.toString())
    if(!inheritorsEntity)return;
    inheritorsEntity.ethAllocated = ethAllocated
    inheritorsEntity.save()
  
    let idx = findItemIndex(inheritorsList, inheritor)
    const sh = share.splice(i32(idx + 1), 1);
    vault.ethShares = sh
    vault.save()
    
  }

}

export function handleEthDeposited(event: EthDepositedEvent): void {
 let vault = Vault.load(event.params.vaultId.toString())
if(vault){
 let prevAmt = vault.StartingAmount
 let currentAmt = event.params._amount
 vault.StartingAmount = currentAmt.plus(prevAmt)
  vault.save()
}

}

export function handleEthWithdrawn(event: EthWithdrawnEvent): void {
  let vault = Vault.load(event.params.vaultId.toString())
  if(vault){
   let prevAmt = vault.StartingAmount
   let currentAmt = event.params._amount
   vault.StartingAmount = prevAmt.minus(currentAmt)
    vault.save()
  }
 
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {

}



export function handleclaimedTokens(event: ClaimedTokensEvent): void {
 
}


export function handleinheritorsAdded(event: InheritorsAddedEvent): void {
  let id = event.params.vaultId.toString()
  let vault = Vault.load(id)
  let inAddress = event.params.newInheritors
  let amt = event.params.newWeiShares
  if(vault){
    let v = vault.inherit
    let shares = vault.ethShares

    for (let i = 0; i < inAddress.length; i++) {
      let inh = inAddress[i].toHexString()
      v.push(inh)
      let amount = amt[i]
      shares.push(amount)
      let newInhertor =   new Inheritor(inh)
      let arr = newInhertor.vaultId
      arr.push(id)
      newInhertor.vaultId = arr
      newInhertor.save()
    }
    vault.inherit = v
    vault.ethShares = shares
    vault.save()
  }

}


export function handleinheritorsRemoved(event: InheritorsRemovedEvent): void {
  let id = event.params.vaultId.toString()
  let vault = Vault.load(id)
  let inAddress = event.params.inheritors
  let empty = ['']

  for (let i = 0; i < inAddress.length; i++) {
    let inh = inAddress[i].toHexString()
    store.remove('Inheritor', inh) //remove from Inheritor entity
    empty.push(inh)
    empty.shift()  //remove first element empty string

  }
    if(vault){
    let arr = vault.inherit
    let share = vault.ethShares


    for (let i = 0; i < inAddress.length; i++) {
      const inh = inAddress[i].toHexString()
      const idx =  findItemIndex(vault.inherit, inh)    
      const sh = share.splice(i32(idx + 1), 1);
      vault.ethShares = sh
      vault.save()
    }

    let v = removeItems(arr, empty)
    vault.inherit = v
    vault.save()
    
  }    
  }


export function handletokenAllocated(event: TokenAllocatedEvent): void {
  let inheritors = event.params.inheritors
  let tokenAllocations = event.params.amounts
  let tokenAddress = event.params.token
  let token = Token.load(tokenAddress.toHexString())
  if(!token) return;

  for (let i = 0; i < inheritors.length; i++) {
    const inheritor = inheritors[i].toHexString();
    if(inheritor) return;
    token.amountAllocated = tokenAllocations[i]
    token.ownerinheritor = inheritor
    token.save()
    
  }



}


export function handletokensDeposited(event: TokensDepositedEvent): void {
  let vault = Vault.load(event.params.vaultId.toString())
  let tokenAddress = event.params.tokens
  let amt = event.params.amounts

  if(!vault) return
    for (let i = 0; i < tokenAddress.length; i++) {  
      let tokenList =  vault.tokensArray
      const element = tokenAddress[i];
      let newToken = new Token(element.toHexString())
      let token  = Token.load(element.toHexString())
      if(!token) {
      
     
        newToken.amount = amt[i]
        newToken.tokenAddress = element
        newToken.owner = event.params.vaultId.toString()
        
        newToken.save()

        tokenList.push(element.toHexString())
        tokenList.push(amt[i].toString())
        vault.tokensArray = tokenList
        vault.save()
      }

      if(token){
        let currentTokenAmt = token.amount
        if(currentTokenAmt){
          let idx = findItemIndex(tokenList, element.toHexString())
          let currentTokenAm = tokenList[i32(idx + 2)]
          let newTokenAm = bigInt.fromString(currentTokenAm).plus(amt[i]).toString()
          tokenList[i32(idx + 2)] = newTokenAm
          vault.tokensArray = tokenList
          vault.save()

          token.tokenAddress = element
          token.amount = currentTokenAmt.plus(amt[i])
          token.owner = event.params.vaultId.toString()
         
          token.save()
        }
      }      
    }
}

export function handletokensWithdrawn(event: TokensWithdrawnEvent): void {
  let tokenAddress = event.params.tokens
  let amt = event.params.amounts
    for (let i = 0; i < tokenAddress.length; i++) {
      const element = tokenAddress[i];
      let token  = Token.load(element.toHexString())
      if(!token) return

      let prevAmt = token.amount
      let currentAmt = amt[i]
      if(!prevAmt) return;
      token.amount = prevAmt.minus(currentAmt)
       token.save()
    }
  
}


export function handlevaultCreated(event: VaultCreatedEvent): void { 
  let id = event.params.vaultId.toString()
  let inher = event.params.inheritors_

  let vaultcreated = new Vault(id)  
  let em = [""]

  // create or update inheritors to vaults
  for (let i = 0; i < inher.length; i++) {
    const element = inher[i].toHexString(); 
      em.push(element) 
      em.shift()
      let inh =   new Inheritor(element)
      let arr = inh.vaultId
      arr.push(id)
      inh.vaultId = arr
      inh.vaults = id
      inh.save()
  }
  

  let shares = [bigInt.fromString("0")]
  for (let i = 0; i < inher.length; i++) {
  shares.push(bigInt.fromString("0"))
   shares.shift();
  }

  vaultcreated.inherit = em 
 vaultcreated.ethShares = shares
  vaultcreated.backup = event.params.backup
  vaultcreated.StartingAmount = event.params.startingBalance
  vaultcreated.vaultId = event.params.vaultId
 vaultcreated.owner =  event.params.owner
  vaultcreated.save()  
}
