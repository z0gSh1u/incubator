#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
    int input, divf, divr, ff, rr;
    bool isP=false;
    cin >> input;

    divf = 10000;
    divr = 10;
    
    while (!(divf<divr))
    {
        ff = input/divf;
        rr = (input%(10*divr)) % divr;
        isP = (ff==rr);
		if (!isP) break;
        divf /= 10;
        divr *= 10;
    }

    if (isP) cout << input << " is a palindrome." << endl;
    else cout << input << " is not a palindrome." << endl;
    
    system("pause");
    return 0;
}