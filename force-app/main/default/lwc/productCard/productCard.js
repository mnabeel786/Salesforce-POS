import { LightningElement, wire, api, track } from 'lwc';

//GraphQL wire adapter
import { gql, graphql } from "lightning/uiGraphQLApi";

// Lightning Message Service and a message channel
import { NavigationMixin } from 'lightning/navigation';
import { subscribe, MessageContext } from 'lightning/messageService';
import PRODUCT_SELECTED_MESSAGE from '@salesforce/messageChannel/ProductSelected__c';

export default class ProductCard extends NavigationMixin(LightningElement) {

    // Id of Product__c to display
    recordId;

    // Product fields displayed with specific format
    productName;
    productPictureUrl;
    price;
    @track graphqlData;

    /** Load context for Lightning Messaging Service */
    @wire(MessageContext) messageContext;

    /** Subscription for ProductSelected Lightning message */
    productSelectionSubscription;

    @wire(graphql, {
        query: gql`
        query getProperties($recordId: ID!){
            uiapi {
              query {
                Product__c(
                    where:{
                        Id: {eq: $recordId}
                    }) 
                    {
                  edges {
                    node {
                      Id
                      Name {
                        value
                      }
                      Picture_URL__c{
                        value
                      }
                      Category__c{
                        value
                      }
                      MSRP__c{
                        value
                      }
                    }
                  }
                  pageInfo{
                    endCursor
                    hasNextPage
                    hasPreviousPage
                  }
                }
              }
            }
          }
        `,
        variables: "$variables",
    })
    graphqlQueryResult({ data }) {
        if (data) {
            console.log('graph query result');
            console.log(data);
            this.graphqlData =  data.uiapi.query.Product__c.edges.map(edge => edge.node);
            console.log(this.graphqlData);
        }
    }
    get variables() {
        return {
            recordId: this.recordId
        };
    }
    // Trigger this function via a refresh button on the UI, or via javascript
    @api
    async refreshGraphQL() {
        return refreshGraphQL(this.graphqlData);
    }

    connectedCallback() {
        // Subscribe to ProductSelected message
        this.productSelectionSubscription = subscribe(
            this.messageContext,
            PRODUCT_SELECTED_MESSAGE,
            (message) => this.handleProductSelected(message.productId)
        );
    }

    handleRecordLoaded(event) {
        const { records } = event.detail;
        const recordData = records[this.recordId];
        console.log(recordData);
        // this.productName = this.graphqlData[0].node.Name;
        // this.productPictureUrl = this.graphqlData[0].node.Picture_URL__c;
        // this.price = this.graphqlData[0].node.MSRP__c;
    }

    /**
     * Handler for when a product is selected. When `this.recordId` changes, the
     * lightning-record-view-form component will detect the change and provision new data.
     */
    handleProductSelected(productId) {
        console.log(productId);
        this.recordId = productId;
    }
}
