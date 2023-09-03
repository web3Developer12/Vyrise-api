const express = require('express');
const { ethers } = require('ethers');

const app = express();
const port = process.env.PORT || 3000;


app.get('/getBalance/:address', async (req, res) => {
  try {
    const address = req.params.address;

    const provider = await new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com');

    const balance = await provider.getBalance(address);

    const etherBalance = ethers.utils.formatEther(balance);

    res.json({ address, balance: etherBalance });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the balance.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
