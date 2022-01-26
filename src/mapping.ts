import { bigInt, BigInt, Bytes, log, store } from "@graphprotocol/graph-ts"

import {
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
  pingVault as PingVaultEvent,
  backupAddress as BackupAddressEvent,
  
  
} from "../generated/SafeKeep/SafeKeep"
import { Token, Inheritor,  Vault, Ping, Backup, AllocationHistory, InheritorHistory, TokenTransactionHistory, SingleTokenHistory, NativeToken , NativeHistory  } from "../generated/schema"
 
import {findItemIndex,} from './utils'

export function handlepingVault(event: PingVaultEvent): void {
  let vaultId = event.params.vaultId.toString()
  let time = event.block.timestamp
  let ping = new Ping(time.toString())
  ping.time = time
  ping.pingtimestamp = vaultId
  ping.save()
}

export function handlebackupAddress(event: BackupAddressEvent): void {
  let vaultId = event.params.vaultId.toString()
  let backupAddress = event.params.backup
  let backup = new Backup(event.block.timestamp.toString())
  backup.address = backupAddress
  backup.createdAt = event.block.timestamp
  backup.backupAddress= vaultId
  backup.save()

  let vault = Vault.load(vaultId)
  if (!vault) return
  vault.currentBackupTime = event.block.timestamp
  vault.backup = event.params.backup
  vault.save()
 
}

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
  let inheritors = event.params.inheritors
  let ethAllocations = event.params.amounts
  let id = event.params.vaultId.toString()

  for (let i = 0; i < inheritors.length; i++) {
    const inheritor = inheritors[i].toHexString();
    const ethAllocated = ethAllocations[i];
    let inheritorsEntity = Inheritor.load(inheritor)
    if(!inheritorsEntity)return;
    inheritorsEntity.ethAllocated = ethAllocated
    inheritorsEntity.save() 

      //allocation history
    let allocation = new AllocationHistory(event.transaction.hash.toHexString())
    allocation.vault = id
     allocation.type= 'eth'
     allocation.amount = ethAllocated
     allocation.receipient = inheritors[i]
    allocation.createdAt = event.block.timestamp
     allocation.save()
  }


  

}

export function handleEthDeposited(event: EthDepositedEvent): void {
 let vault = Vault.load(event.params.vaultId.toString())
 let id = event.params.vaultId.toString()

 let nativeHistory = new NativeHistory(event.transaction.hash.toHexString())
 nativeHistory.vault = id
 nativeHistory.type = "in"
 nativeHistory.amount = event.params._amount
 nativeHistory.createdAt = event.block.timestamp
 nativeHistory.save()

 
 if(vault){
   let prevAmt = vault.StartingAmount
   let currentAmt = event.params._amount
   vault.StartingAmount = currentAmt.plus(prevAmt)
   vault.save()
   
//  all token history
   let tokenHistory = new TokenTransactionHistory(event.transaction.hash.toHexString())
  tokenHistory.vault = id
  tokenHistory.type = "in"
  tokenHistory.tokenAddress = new Bytes(0x1)
  tokenHistory.amount = event.params._amount
  
  tokenHistory.createdAt = event.block.timestamp 
  tokenHistory.save()

  
  let loadVaults = Vault.load(event.params.vaultId.toString())
  if(!loadVaults) return;
  let prevValue = loadVaults.tokenTransactionHistoryRecords
  loadVaults.tokenTransactionHistoryRecords = prevValue.plus(new BigInt(1))
  loadVaults.save()
}

}

export function handleEthWithdrawn(event: EthWithdrawnEvent): void {
  let vault = Vault.load(event.params.vaultId.toString())
  let id = event.params.vaultId.toString()
  let tokenHistory = new TokenTransactionHistory(event.transaction.hash.toHexString())
  if(vault){
   let prevAmt = vault.StartingAmount
   let currentAmt = event.params._amount
   vault.StartingAmount = prevAmt.minus(currentAmt)
    vault.save()

    tokenHistory.vault = id
    tokenHistory.type = "out"
    tokenHistory.tokenAddress = new Bytes(0x1)
    tokenHistory.createdAt = event.block.timestamp 
    tokenHistory.amount = event.params._amount
    
    tokenHistory.save()

   
  let nativeHistory = new NativeHistory(event.transaction.hash.toHexString())
  nativeHistory.vault = id
  nativeHistory.type = "out"
  nativeHistory.amount = event.params._amount
  nativeHistory.createdAt = event.block.timestamp
  nativeHistory.save()


    let loadVaults = Vault.load(event.params.vaultId.toString())
    if(!loadVaults) return;
    let prevHistoryCount = loadVaults.tokenTransactionHistoryRecords        
    loadVaults.tokenTransactionHistoryRecords = prevHistoryCount.plus(new BigInt(1))
    loadVaults.save()
  }
 
}

export function handleOwnershipTransferred(event: OwnershipTransferredEvent): void {

}


export function handleclaimedTokens(event: ClaimedTokensEvent): void {
 
}


export function handleinheritorsAdded(event: InheritorsAddedEvent): void {
  let id = event.params.vaultId.toString()
  let inAddress = event.params.newInheritors
  let vault  = Vault.load(id)
  let amt = event.params.newWeiShares
  if(!vault) return;

    for (let i = 0; i < inAddress.length; i++) {
      let inh = inAddress[i].toHexString()
      let newInhertor =   new Inheritor(inh)
      newInhertor.ethAllocated = amt[i]
      newInhertor.createdAt = event.block.timestamp
      newInhertor.vaults = id
      newInhertor.save()
      let totalAllocated = vault.totalEthAllocated.plus(amt[i])
      vault.totalEthAllocated = totalAllocated
      vault.save()

         //inheritor history
     let inheritorHistory = new InheritorHistory(event.block.hash.toHexString())
        inheritorHistory.vault = id
        inheritorHistory.type= "in"
        inheritorHistory.inheritor = inAddress[i]
        inheritorHistory.createdAt = event.block.timestamp
        inheritorHistory.save()
  
  }

}


export function handleinheritorsRemoved(event: InheritorsRemovedEvent): void {
  let inAddress = event.params.inheritors
  let vault = Vault.load(event.params.vaultId.toString())
  let id = event.params.vaultId.toString()
  if(!vault) return;
  for (let i = 0; i < inAddress.length; i++) {
      let inheritor = Inheritor.load(inAddress[i].toHexString())
      if(!inheritor) return;
      let allocated = inheritor.ethAllocated
      let totalAllocated = vault.totalEthAllocated.minus(allocated)
      vault.totalEthAllocated = totalAllocated
      vault.save()
    store.remove('Inheritor', inAddress[i].toHexString()) //remove from Inheritor entity
    
         //inheritor history
         let inheritorHistory = new InheritorHistory(event.block.hash.toHexString())
         inheritorHistory.vault = id
         inheritorHistory.type= ""
         inheritorHistory.inheritor = inAddress[i]
         inheritorHistory.createdAt = event.block.timestamp
         inheritorHistory.save()
  }  
  }


export function handletokenAllocated(event: TokenAllocatedEvent): void {
  let inheritors = event.params.inheritors
  let tokenAllocations = event.params.amounts
  let tokenAddress = event.params.token
  let token = Token.load(tokenAddress.toHexString())
  let id = event.params.vaultId.toString()
  if(!token) return;

  for (let i = 0; i < inheritors.length; i++) {
    const allocated = tokenAllocations[i];
    token.amountAllocated = allocated
    token.ownerinheritor = inheritors[i].toHexString()
    token.allocated = allocated
    token.save()

     //allocation history
     let allocation = new AllocationHistory(event.transaction.hash.toHexString())
     allocation.vault = id
      allocation.type= 'tokens'
      allocation.amount = allocated
      allocation.assetAddress = tokenAddress
      allocation.receipient = inheritors[i]
     allocation.createdAt = event.block.timestamp
      allocation.save()  
  }
}


export function handletokensDeposited(event: TokensDepositedEvent): void {
  let vault = Vault.load(event.params.vaultId.toString())
  let tokenAddress = event.params.tokens
  let amt = event.params.amounts
  let id = event.params.vaultId.toString()

  if(!vault) return
    for (let i = 0; i < tokenAddress.length; i++) {  
      let tokenList =  vault.tokensArray
      const element = tokenAddress[i];
      let newToken = new Token(element.toHexString())
      let token  = Token.load(element.toHexString())
      let singleHistory = new SingleTokenHistory(event.block.hash.toHexString())

   
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
      
      
              //token history
              let tokenHistory = new TokenTransactionHistory(event.transaction.hash.toHexString())
              tokenHistory.vault = id 
              tokenHistory.type = "in"  
              tokenHistory.tokenAddress = element
              tokenHistory.amount = amt[i]
              tokenHistory.createdAt = event.block.timestamp 
              tokenHistory.save()

              
              singleHistory.token = element.toHexString()
              singleHistory.amount = amt[i]
              singleHistory.type = 'in'
              singleHistory.createdAt = event.block.timestamp
              singleHistory.address = element
              singleHistory.hash = event.transaction.hash
              singleHistory.save()
              
              let loadVaults = Vault.load(event.params.vaultId.toString())
              if(!loadVaults) return;
              let prevHistoryCount = loadVaults.tokenTransactionHistoryRecords
              loadVaults.tokenTransactionHistoryRecords = prevHistoryCount.plus(new BigInt(1))
              loadVaults.save()
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
      
      let singleHistory = new SingleTokenHistory(event.block.hash.toHexString())
    singleHistory.token = element.toHexString()
    singleHistory.amount = amt[i]
    singleHistory.type = 'out'
    singleHistory.address = element
    singleHistory.createdAt = event.block.timestamp
    singleHistory.hash = event.transaction.hash
    singleHistory.save()
        //token history
        let tokenHistory = new TokenTransactionHistory(event.transaction.hash.toHexString())
        tokenHistory.vault = event.params.vaultId.toString()
        tokenHistory.type = ""
        tokenHistory.tokenAddress = element
        tokenHistory.amount = currentAmt
        tokenHistory.createdAt = event.block.timestamp 
        tokenHistory.save()
        let loadVaults = Vault.load(event.params.vaultId.toString())
        if(!loadVaults) return;
        let prevHistoryCount = loadVaults.tokenTransactionHistoryRecords
        loadVaults.tokenTransactionHistoryRecords = prevHistoryCount.plus(new BigInt(1))
        loadVaults.save()

    }
  
}


export function handlevaultCreated(event: VaultCreatedEvent): void { 
  let id = event.params.vaultId.toString()
  let inher = event.params.inheritors_
  let backupAddress = event.params.backup


  
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

  //backups
  let backups = new Backup(event.block.timestamp.toString())
  backups.backupAddress= id
 backups.address = backupAddress
  backups.createdAt = event.block.timestamp
  backups.save()

  

  let nativeHistory = new NativeHistory(event.transaction.hash.toHexString())
  nativeHistory.vault = id
  nativeHistory.type = "in"
  nativeHistory.amount = event.params.startingBalance
  nativeHistory.typeTag = 'native'
  nativeHistory.createdAt = event.block.timestamp
  nativeHistory.save()

  
  vaultcreated.inherit = em 
  vaultcreated.backup = event.params.backup
  vaultcreated.currentBackupTime = event.block.timestamp
  vaultcreated.StartingAmount = event.params.startingBalance
  vaultcreated.vaultId = event.params.vaultId
 vaultcreated.owner =  event.params.owner
 vaultcreated.createdAt = event.block.timestamp
  vaultcreated.save()  
}
