// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDPassport
 * @dev Decentralized Identity (DID) Passport and Verifiable Credentials Registry
 */
contract DIDPassport {
    address public owner;

    struct Passport {
        string did;
        address holder;
        string fullName;
        string nationality;
        uint256 dateOfBirth; // UNIX timestamp
        string passportNumber;
        string avatarUrl;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
        bool exists;
        bytes32[] credentialIds;
    }

    struct Credential {
        bytes32 id;
        address issuer;
        string issuerName;
        address subject;
        string credentialType; // e.g. "KYC_VERIFICATION", "SCHENGEN_VISA", "DIGITAL_NOMAD", "PROOF_OF_HUMANITY"
        string title;
        string dataHash;
        uint256 issuedAt;
        uint256 expiresAt; // 0 for lifetime/permanent
        bool isRevoked;
        bool exists;
    }

    mapping(address => bool) public authorizedIssuers;
    mapping(address => string) public issuerNames;
    address[] public issuerList;

    mapping(address => Passport) private passports;
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) private subjectCredentials;
    address[] public registeredHolders;

    event PassportRegistered(
        address indexed holder,
        string did,
        string passportNumber,
        string fullName
    );
    event PassportUpdated(
        address indexed holder,
        string fullName,
        string avatarUrl
    );
    event PassportStatusChanged(address indexed holder, bool isActive);
    event IssuerAuthorized(address indexed issuer, string name);
    event IssuerRevoked(address indexed issuer);
    event CredentialIssued(
        bytes32 indexed id,
        address indexed subject,
        address indexed issuer,
        string credentialType,
        string title
    );
    event CredentialRevoked(bytes32 indexed id, address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner,
            "Caller is not an authorized issuer"
        );
        _;
    }

    modifier onlyPassportHolder() {
        require(passports[msg.sender].exists, "No passport found for sender");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        issuerNames[msg.sender] = "Genesis Border & Identity Authority";
        issuerList.push(msg.sender);
    }

    /**
     * @dev Authorize a trusted issuer (embassy, border control, KYC provider)
     */
    function addIssuer(address _issuer, string memory _name) external onlyOwner {
        require(_issuer != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Issuer name required");

        if (!authorizedIssuers[_issuer]) {
            issuerList.push(_issuer);
        }
        authorizedIssuers[_issuer] = true;
        issuerNames[_issuer] = _name;

        emit IssuerAuthorized(_issuer, _name);
    }

    /**
     * @dev Revoke an issuer's authorization
     */
    function removeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuers[_issuer], "Issuer not authorized");
        require(_issuer != owner, "Cannot revoke contract owner");

        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer);
    }

    /**
     * @dev Convert address to ASCII string for DID generation
     */
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Generate pseudo-unique passport number
     */
    function generatePassportNumber(address _holder) internal view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_holder, block.timestamp, block.prevrandao));
        bytes memory alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        bytes memory num = new bytes(9);
        num[0] = "P";
        num[1] = "-";
        for (uint256 i = 0; i < 7; i++) {
            num[2 + i] = alphabet[uint8(hash[i]) % alphabet.length];
        }
        return string(num);
    }

    /**
     * @dev Register a new DID Passport on-chain
     */
    function registerPassport(
        string memory _fullName,
        string memory _nationality,
        uint256 _dateOfBirth,
        string memory _avatarUrl
    ) external {
        require(!passports[msg.sender].exists, "Passport already exists for this wallet");
        require(bytes(_fullName).length > 0, "Full name required");
        require(bytes(_nationality).length > 0, "Nationality required");
        require(_dateOfBirth < block.timestamp, "Invalid date of birth");

        string memory generatedDid = string(
            abi.encodePacked("did:ethr:", addressToString(msg.sender))
        );
        string memory passportNum = generatePassportNumber(msg.sender);

        uint256 issuedAt = block.timestamp;
        uint256 expiresAt = block.timestamp + (3650 days); // 10 years validity

        Passport storage p = passports[msg.sender];
        p.did = generatedDid;
        p.holder = msg.sender;
        p.fullName = _fullName;
        p.nationality = _nationality;
        p.dateOfBirth = _dateOfBirth;
        p.passportNumber = passportNum;
        p.avatarUrl = _avatarUrl;
        p.issuedAt = issuedAt;
        p.expiresAt = expiresAt;
        p.isActive = true;
        p.exists = true;

        registeredHolders.push(msg.sender);

        emit PassportRegistered(msg.sender, generatedDid, passportNum, _fullName);
    }

    /**
     * @dev Update editable profile attributes
     */
    function updatePassport(
        string memory _fullName,
        string memory _avatarUrl
    ) external onlyPassportHolder {
        require(bytes(_fullName).length > 0, "Full name required");
        Passport storage p = passports[msg.sender];
        p.fullName = _fullName;
        p.avatarUrl = _avatarUrl;

        emit PassportUpdated(msg.sender, _fullName, _avatarUrl);
    }

    /**
     * @dev Freeze or unfreeze the passport (e.g. if wallet is compromised)
     */
    function togglePassportStatus(bool _isActive) external onlyPassportHolder {
        passports[msg.sender].isActive = _isActive;
        emit PassportStatusChanged(msg.sender, _isActive);
    }

    /**
     * @dev Authorized issuer issues a verifiable credential or travel visa stamp
     */
    function issueCredential(
        address _subject,
        string memory _credentialType,
        string memory _title,
        string memory _dataHash,
        uint256 _validityDays
    ) external onlyAuthorizedIssuer returns (bytes32) {
        require(passports[_subject].exists, "Subject has no registered passport");
        require(bytes(_credentialType).length > 0, "Credential type required");
        require(bytes(_title).length > 0, "Title required");

        bytes32 credId = keccak256(
            abi.encodePacked(
                _subject,
                msg.sender,
                _credentialType,
                block.timestamp,
                subjectCredentials[_subject].length
            )
        );

        string memory issuerLabel = bytes(issuerNames[msg.sender]).length > 0
            ? issuerNames[msg.sender]
            : "Authorized Border Authority";

        uint256 exp = _validityDays == 0 ? 0 : block.timestamp + (_validityDays * 1 days);

        credentials[credId] = Credential({
            id: credId,
            issuer: msg.sender,
            issuerName: issuerLabel,
            subject: _subject,
            credentialType: _credentialType,
            title: _title,
            dataHash: _dataHash,
            issuedAt: block.timestamp,
            expiresAt: exp,
            isRevoked: false,
            exists: true
        });

        subjectCredentials[_subject].push(credId);
        passports[_subject].credentialIds.push(credId);

        emit CredentialIssued(credId, _subject, msg.sender, _credentialType, _title);
        return credId;
    }

    /**
     * @dev Revoke a credential (can be called by the issuer or contract owner)
     */
    function revokeCredential(bytes32 _credId) external {
        Credential storage cred = credentials[_credId];
        require(cred.exists, "Credential does not exist");
        require(
            msg.sender == cred.issuer || msg.sender == owner,
            "Only issuer or owner can revoke"
        );
        require(!cred.isRevoked, "Credential already revoked");

        cred.isRevoked = true;
        emit CredentialRevoked(_credId, msg.sender);
    }

    /**
     * @dev Retrieve full passport details for an address
     */
    function getPassport(address _holder)
        external
        view
        returns (
            string memory did,
            string memory fullName,
            string memory nationality,
            uint256 dateOfBirth,
            string memory passportNumber,
            string memory avatarUrl,
            uint256 issuedAt,
            uint256 expiresAt,
            bool isActive,
            bool exists,
            uint256 credentialCount
        )
    {
        Passport storage p = passports[_holder];
        return (
            p.did,
            p.fullName,
            p.nationality,
            p.dateOfBirth,
            p.passportNumber,
            p.avatarUrl,
            p.issuedAt,
            p.expiresAt,
            p.isActive,
            p.exists,
            p.credentialIds.length
        );
    }

    /**
     * @dev Retrieve specific credential details
     */
    function getCredential(bytes32 _credId)
        external
        view
        returns (Credential memory)
    {
        require(credentials[_credId].exists, "Credential does not exist");
        return credentials[_credId];
    }

    /**
     * @dev Retrieve all credentials issued to a subject
     */
    function getCredentials(address _subject)
        external
        view
        returns (Credential[] memory)
    {
        bytes32[] storage ids = subjectCredentials[_subject];
        Credential[] memory list = new Credential[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            list[i] = credentials[ids[i]];
        }
        return list;
    }

    /**
     * @dev Fast verification overview of a passport for verifiers/immigration
     */
    function verifyPassport(address _holder)
        external
        view
        returns (
            bool isRegistered,
            bool isValid,
            bool isSuspended,
            bool isExpired,
            uint256 activeCredentialsCount
        )
    {
        Passport storage p = passports[_holder];
        if (!p.exists) {
            return (false, false, false, false, 0);
        }

        bool expired = block.timestamp > p.expiresAt;
        bool suspended = !p.isActive;
        bool valid = p.exists && !suspended && !expired;

        uint256 activeCreds = 0;
        bytes32[] storage ids = subjectCredentials[_holder];
        for (uint256 i = 0; i < ids.length; i++) {
            Credential storage c = credentials[ids[i]];
            bool cExpired = (c.expiresAt > 0 && block.timestamp > c.expiresAt);
            if (!c.isRevoked && !cExpired) {
                activeCreds++;
            }
        }

        return (p.exists, valid, suspended, expired, activeCreds);
    }

    /**
     * @dev Selective disclosure helper: checks if holder is at least 18 years old
     * without exposing date of birth to verifiers.
     */
    function isAdult(address _holder) external view returns (bool) {
        if (!passports[_holder].exists || !passports[_holder].isActive) {
            return false;
        }
        // 18 years in seconds (approx 18 * 365.25 days = 568029600 seconds)
        return block.timestamp >= passports[_holder].dateOfBirth + 568029600;
    }

    /**
     * @dev Get count of total registered passports
     */
    function getTotalHolders() external view returns (uint256) {
        return registeredHolders.length;
    }

    /**
     * @dev Get all authorized issuers
     */
    function getAuthorizedIssuers() external view returns (address[] memory) {
        return issuerList;
    }
}
