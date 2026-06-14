#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
    int input,a,b,c,d,e,bak;
	
	cin >> input;
	bak=input;

	a=input%100;
	input/=1000;
	b=input;
	c=b%10;
	b/=10;
	d=b;
	e=c*10+d;

    if (e==a) cout << bak << " is a palindrome." << endl;
    else cout << bak << " is not a palindrome." << endl;
    
    system("pause");
    return 0;
}