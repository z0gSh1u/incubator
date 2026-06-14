#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
    // Upper
    for (int i=1; i<=4; i++)  // Line Control
    {
        for (int j=1; j<=(4-i+1); j++)  // Space Control
            cout << ' ';
        for (int k=1; k<=(2*i-1); k++)  // * Control
            cout << '*';
        cout << endl;    
    }

    // Middle
    for (int i=1; i<=9; i++)
        cout << '*';
    cout << endl;

    // Lower
    for (int i=4; i>=1; i--)  // Line Control
    {
        for (int j=(4-i+1); j>=1; j--)  // Space Control
            cout << ' ';
        for (int k=(2*i-1); k>=1; k--)  // * Control
            cout << '*';
        cout << endl;    
    }

	system("pause");
    return 0;
}