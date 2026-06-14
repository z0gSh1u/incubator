#include <iostream>
#include <cstdlib>

using namespace std;

int main()
{
    int fac=1, input;
    cin >> input;

    while (input>=1)
    {
        fac *= input;
        input--;
    }

    cout << "Its factorial is " << fac << "." << endl;

    system("pause");

    return 0;
}