#!/bin/bash
while :
do
    ipfs daemon --enable-namesys-pubsub --enable-pubsub-experiment &
    sleep 10
    ipfs swarm connect /ip4/18.157.205.205/tcp/4001/p2p/12D3KooWDwQ1R9ZmDRv8aWL4dJ4svS9AYvwfJicQ1F45W5aHAVmy
    fg
    sleep 2
done
