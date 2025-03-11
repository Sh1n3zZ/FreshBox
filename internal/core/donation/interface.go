package donation

import (
	"context"
	"math/big"
)

// BlockchainService 区块链服务接口
type BlockchainService interface {
	// CreateDonation 创建捐赠交易
	CreateDonation(ctx context.Context, donation *Donation) (*Transaction, error)

	// GetTransactionStatus 获取交易状态
	GetTransactionStatus(ctx context.Context, txHash string) (*TransactionStatus, error)

	// GenerateProof 生成捐赠凭证
	GenerateProof(ctx context.Context, txHash string) (*DonationProof, error)
}

// Donation 捐赠信息
type Donation struct {
	ID          string   `json:"id"`
	DonorID     string   `json:"donor_id"`
	Amount      *big.Int `json:"amount"`
	TokenType   string   `json:"token_type"`
	Message     string   `json:"message"`
	Beneficiary string   `json:"beneficiary"`
}

// Transaction 交易信息
type Transaction struct {
	Hash      string   `json:"hash"`
	From      string   `json:"from"`
	To        string   `json:"to"`
	Value     *big.Int `json:"value"`
	Status    string   `json:"status"`
	Timestamp int64    `json:"timestamp"`
}

// TransactionStatus 交易状态
type TransactionStatus struct {
	Hash          string `json:"hash"`
	Status        string `json:"status"`
	Confirmations uint64 `json:"confirmations"`
	BlockNumber   uint64 `json:"block_number"`
	ErrorMessage  string `json:"error_message,omitempty"`
}

// DonationProof 捐赠凭证
type DonationProof struct {
	ProofID     string `json:"proof_id"`
	DonationID  string `json:"donation_id"`
	TxHash      string `json:"tx_hash"`
	ProofHash   string `json:"proof_hash"`
	IPFSHash    string `json:"ipfs_hash"`
	Certificate string `json:"certificate"`
}
