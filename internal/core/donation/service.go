package donation

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/pkg/errors"
)

// PolygonService Polygon区块链服务实现
type PolygonService struct {
	client      *ethclient.Client
	contract    common.Address
	auth        *bind.TransactOpts
	ipfsGateway string
}

// NewPolygonService 创建Polygon区块链服务
func NewPolygonService(client *ethclient.Client, contractAddr string, auth *bind.TransactOpts, ipfsGateway string) (*PolygonService, error) {
	contract := common.HexToAddress(contractAddr)
	return &PolygonService{
		client:      client,
		contract:    contract,
		auth:        auth,
		ipfsGateway: ipfsGateway,
	}, nil
}

// CreateDonation 创建捐赠交易
func (s *PolygonService) CreateDonation(ctx context.Context, donation *Donation) (*Transaction, error) {
	// 准备交易参数
	opts := &bind.TransactOpts{
		From:   s.auth.From,
		Signer: s.auth.Signer,
		Value:  donation.Amount,
	}

	// 调用智能合约
	tx, err := s.donateToContract(ctx, opts, donation)
	if err != nil {
		return nil, errors.Wrap(err, "创建捐赠交易失败")
	}

	// 构建交易信息
	transaction := &Transaction{
		Hash:      tx.Hash().Hex(),
		From:      opts.From.Hex(),
		To:        s.contract.Hex(),
		Value:     donation.Amount,
		Status:    "pending",
		Timestamp: time.Now().Unix(),
	}

	return transaction, nil
}

// GetTransactionStatus 获取交易状态
func (s *PolygonService) GetTransactionStatus(ctx context.Context, txHash string) (*TransactionStatus, error) {
	hash := common.HexToHash(txHash)

	// 获取交易收据
	receipt, err := s.client.TransactionReceipt(ctx, hash)
	if err != nil {
		return nil, errors.Wrap(err, "获取交易收据失败")
	}

	// 获取当前区块
	header, err := s.client.HeaderByNumber(ctx, nil)
	if err != nil {
		return nil, errors.Wrap(err, "获取区块头失败")
	}

	// 计算确认数
	confirmations := header.Number.Uint64() - receipt.BlockNumber.Uint64()

	status := &TransactionStatus{
		Hash:          txHash,
		Status:        getStatusString(receipt.Status),
		Confirmations: confirmations,
		BlockNumber:   receipt.BlockNumber.Uint64(),
	}

	return status, nil
}

// GenerateProof 生成捐赠凭证
func (s *PolygonService) GenerateProof(ctx context.Context, txHash string) (*DonationProof, error) {
	// 获取交易状态
	status, err := s.GetTransactionStatus(ctx, txHash)
	if err != nil {
		return nil, err
	}

	// 确保交易已确认
	if status.Status != "success" {
		return nil, errors.New("交易尚未成功确认")
	}

	// 生成证明哈希
	proofHash := generateProofHash(txHash, status.BlockNumber)

	// 上传到IPFS（这里需要实现IPFS上传逻辑）
	ipfsHash, err := s.uploadToIPFS(ctx, proofHash)
	if err != nil {
		return nil, errors.Wrap(err, "上传IPFS失败")
	}

	// 生成凭证
	proof := &DonationProof{
		ProofID:     fmt.Sprintf("proof_%s", proofHash[:8]),
		DonationID:  txHash,
		TxHash:      txHash,
		ProofHash:   proofHash,
		IPFSHash:    ipfsHash,
		Certificate: generateCertificate(txHash, proofHash, ipfsHash),
	}

	return proof, nil
}

// 辅助函数

func (s *PolygonService) donateToContract(ctx context.Context, opts *bind.TransactOpts, donation *Donation) (*types.Transaction, error) {
	// 这里需要实现具体的合约调用逻辑
	// 返回示例交易
	return nil, errors.New("未实现")
}

func getStatusString(status uint64) string {
	if status == 1 {
		return "success"
	}
	return "failed"
}

func generateProofHash(txHash string, blockNumber uint64) string {
	data := fmt.Sprintf("%s_%d", txHash, blockNumber)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func generateCertificate(txHash, proofHash, ipfsHash string) string {
	// 生成证书内容
	return fmt.Sprintf("FreshBox Donation Certificate\nTransaction: %s\nProof: %s\nIPFS: %s",
		txHash, proofHash, ipfsHash)
}

func (s *PolygonService) uploadToIPFS(ctx context.Context, data string) (string, error) {
	// 这里需要实现IPFS上传逻辑
	// 返回示例哈希
	return "QmExample...", nil
}
